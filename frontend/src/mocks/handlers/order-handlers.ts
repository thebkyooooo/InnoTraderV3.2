import { http, HttpResponse } from 'msw'

// 계좌주문 API Mock — 백엔드 com.innotrader.order 미러링.
// /api/private/order/** (인증 필요: Authorization Bearer 헤더)

const URL_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/api/private/order`

type SideCode = 'buy' | 'sell'
type TypeCode = 'MARKET' | 'LIMIT'
type StatusCode = 'RECEIVED' | 'PARTIAL' | 'FILLED' | 'CANCELED' | 'AMENDED' | 'CANCEL_DONE'

const SIDE_NAME: Record<SideCode, string> = { buy: '매수', sell: '매도' }
const TYPE_NAME: Record<TypeCode, string> = { MARKET: '시장가', LIMIT: '지정가' }
const STATUS_NAME: Record<StatusCode, string> = {
  RECEIVED: '접수', PARTIAL: '부분체결', FILLED: '전체체결',
  CANCELED: '취소', AMENDED: '정정완료', CANCEL_DONE: '취소완료',
}
const RECEIPT_STATUSES: StatusCode[] = ['AMENDED', 'CANCEL_DONE']

// 시세/종목명 (stock-master-handlers 8종목 유니버스 — holding-handlers와 동일)
const STOCKS: Record<string, { name: string; price: number }> = {
  '005930': { name: '삼성전자',       price: 72300 },
  '000660': { name: 'SK하이닉스',     price: 198500 },
  '035420': { name: 'NAVER',          price: 215000 },
  '035720': { name: '카카오',         price: 48500 },
  '373220': { name: 'LG에너지솔루션', price: 385000 },
  '005380': { name: '현대자동차',     price: 245000 },
  '086520': { name: '에코프로',       price: 98000 },
  '028300': { name: 'HLB',            price: 67800 },
}
const SYMBOLS = Object.keys(STOCKS)

interface OrderRow {
  accountNo: string
  orderNo: string
  originalOrderNo: string | null
  symbol: string
  side: SideCode
  orderType: TypeCode
  quantity: number
  price: number
  status: StatusCode
  filledQuantity: number
  filledPrice: number
  orderedAt: string
}

// ── 인메모리 주문 저장소 ──────────────────────────────────────────────────────
let store: OrderRow[] = []
let seq = 0
let seeded = false

const nextOrderNo = () => String(++seq).padStart(10, '0')

// 결정적 PRNG (mulberry32)
function makeRng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; return h }

// todayCount: 당일 주문 건수 (이전 1개월 랜덤 1~10건은 별도 추가)
const SEEDS: Array<{ accountNo: string; todayCount: number }> = [
  { accountNo: '123-456789-01', todayCount: 10 },
  { accountNo: '123-456789-02', todayCount: 3 },
  { accountNo: '123-456789-71', todayCount: 0 },
]
const STATUS_POOL: StatusCode[] = ['FILLED', 'FILLED', 'RECEIVED', 'PARTIAL', 'FILLED', 'CANCELED']

// date(자정 기준) 의 장중(09:00~15:29) 랜덤 시각 ISO 문자열
function tradingTime(base: Date, rng: () => number) {
  const d = new Date(base)
  d.setHours(9, Math.floor(rng() * 390), 0, 0)
  return d.toISOString()
}

function makeRow(accountNo: string, rng: () => number, base: Date): OrderRow {
  const symbol = SYMBOLS[Math.floor(rng() * SYMBOLS.length)]
  const side: SideCode = rng() < 0.5 ? 'buy' : 'sell'
  const status = STATUS_POOL[Math.floor(rng() * STATUS_POOL.length)]
  const orderType: TypeCode = status === 'FILLED' && rng() < 0.5 ? 'MARKET' : 'LIMIT'
  const quantity = (1 + Math.floor(rng() * 50)) * 10
  const price = Math.max(1, Math.round(STOCKS[symbol].price * (0.95 + rng() * 0.1)))
  const filledQuantity = status === 'FILLED' ? quantity : status === 'PARTIAL' ? Math.max(1, Math.floor(quantity / 2)) : 0
  const filledPrice = filledQuantity > 0 ? price : 0
  return { accountNo, orderNo: nextOrderNo(), originalOrderNo: null, symbol, side, orderType, quantity, price, status, filledQuantity, filledPrice, orderedAt: tradingTime(base, rng) }
}

// 계좌별: 당일 todayCount건 + 이전 최근 1개월 랜덤(1~10건)
function seedAccount(accountNo: string, todayCount: number) {
  const rng = makeRng(hash(accountNo))
  const today = new Date(); today.setHours(0, 0, 0, 0)
  for (let i = 0; i < todayCount; i++) store.push(makeRow(accountNo, rng, today))
  const pastCount = 1 + Math.floor(rng() * 10)  // 1~10
  for (let i = 0; i < pastCount; i++) {
    const daysAgo = 1 + Math.floor(rng() * 30)
    const date = new Date(today); date.setDate(date.getDate() - daysAgo)
    store.push(makeRow(accountNo, rng, date))
  }
}

function buildSeed() {
  for (const seed of SEEDS) {
    if (seed.todayCount === 0) continue
    seedAccount(seed.accountNo, seed.todayCount)
  }
}

function ensureSeeded() {
  if (seeded) return
  seeded = true
  buildSeed()
}

// 초기화 후 재시드 (POST /seed)
function reseed() {
  store = []
  seq = 0
  seeded = true
  buildSeed()
}

const hasAuth = (request: Request) => !!request.headers.get('Authorization')
const unauthorized = () =>
  HttpResponse.json({ code: 'AUTH_001', message: '인증이 필요합니다.' }, { status: 401 })
const notFound = () =>
  HttpResponse.json({ code: 'ORDER_003', message: 'Order not found' }, { status: 404 })

const currentPrice = (symbol: string, fallback: number) => STOCKS[symbol]?.price ?? fallback
const nameOf = (symbol: string) => STOCKS[symbol]?.name ?? symbol

const orderResp = (o: OrderRow) => ({
  accountNo: o.accountNo, orderNo: o.orderNo, symbol: o.symbol,
  side: o.side, sideName: SIDE_NAME[o.side],
  orderType: o.orderType, orderTypeName: TYPE_NAME[o.orderType],
  quantity: o.quantity, price: o.price,
  status: o.status, statusName: STATUS_NAME[o.status],
  filledQuantity: o.filledQuantity, orderedAt: o.orderedAt,
})

interface PlaceBody { accountNo: string; symbol: string; orderType: TypeCode; quantity: number; price: number }
interface AmendBody { accountNo: string; symbol: string; originalOrderNo: string; orderType: TypeCode; quantity: number; price: number }
interface CancelBody { accountNo: string; symbol: string; originalOrderNo: string }

function placeOrder(side: SideCode, body: PlaceBody) {
  const market = currentPrice(body.symbol, body.price)
  const isMarket = body.orderType === 'MARKET'
  const row: OrderRow = {
    accountNo: body.accountNo, orderNo: nextOrderNo(), originalOrderNo: null,
    symbol: body.symbol, side, orderType: body.orderType,
    quantity: body.quantity, price: isMarket ? market : body.price,
    status: isMarket ? 'FILLED' : 'RECEIVED',
    filledQuantity: isMarket ? body.quantity : 0,
    filledPrice: isMarket ? market : 0,
    orderedAt: new Date().toISOString(),
  }
  store.push(row)
  return orderResp(row)
}

const findOriginal = (accountNo: string, orderNo: string) =>
  store.find(o => o.accountNo === accountNo && o.orderNo === orderNo && !RECEIPT_STATUSES.includes(o.status))

export const orderHandlers = [
  // ─── 매수 ────────────────────────────────────────────────────────────────
  http.post(`${URL_BASE}/buy`, async ({ request }) => {
    if (!hasAuth(request)) return unauthorized()
    ensureSeeded()
    const body = (await request.json()) as PlaceBody
    return HttpResponse.json(placeOrder('buy', body))
  }),

  // ─── 매도 ────────────────────────────────────────────────────────────────
  http.post(`${URL_BASE}/sell`, async ({ request }) => {
    if (!hasAuth(request)) return unauthorized()
    ensureSeeded()
    const body = (await request.json()) as PlaceBody
    return HttpResponse.json(placeOrder('sell', body))
  }),

  // ─── 정정 ────────────────────────────────────────────────────────────────
  http.post(`${URL_BASE}/amend`, async ({ request }) => {
    if (!hasAuth(request)) return unauthorized()
    ensureSeeded()
    const body = (await request.json()) as AmendBody
    const original = findOriginal(body.accountNo, body.originalOrderNo)
    if (!original) return notFound()

    // 원주문 갱신
    original.quantity = body.quantity
    original.price = body.price
    original.orderType = body.orderType
    original.status = 'RECEIVED'

    // 정정완료 접수증
    const receipt: OrderRow = {
      accountNo: body.accountNo, orderNo: nextOrderNo(), originalOrderNo: original.orderNo,
      symbol: body.symbol, side: original.side, orderType: body.orderType,
      quantity: body.quantity, price: body.price, status: 'AMENDED',
      filledQuantity: 0, filledPrice: 0, orderedAt: new Date().toISOString(),
    }
    store.push(receipt)
    return HttpResponse.json({
      accountNo: receipt.accountNo, orderNo: receipt.orderNo, originalOrderNo: receipt.originalOrderNo,
      symbol: receipt.symbol, orderType: receipt.orderType, orderTypeName: TYPE_NAME[receipt.orderType],
      quantity: receipt.quantity, price: receipt.price,
      status: receipt.status, statusName: STATUS_NAME[receipt.status], orderedAt: receipt.orderedAt,
    })
  }),

  // ─── 취소 ────────────────────────────────────────────────────────────────
  http.post(`${URL_BASE}/cancel`, async ({ request }) => {
    if (!hasAuth(request)) return unauthorized()
    ensureSeeded()
    const body = (await request.json()) as CancelBody
    const original = findOriginal(body.accountNo, body.originalOrderNo)
    if (!original) return notFound()

    const cancelQuantity = Math.max(0, original.quantity - original.filledQuantity)
    original.status = 'CANCELED'

    const receipt: OrderRow = {
      accountNo: body.accountNo, orderNo: nextOrderNo(), originalOrderNo: original.orderNo,
      symbol: body.symbol, side: original.side, orderType: original.orderType,
      quantity: cancelQuantity, price: original.price, status: 'CANCEL_DONE',
      filledQuantity: 0, filledPrice: 0, orderedAt: new Date().toISOString(),
    }
    store.push(receipt)
    return HttpResponse.json({
      accountNo: receipt.accountNo, orderNo: receipt.orderNo, originalOrderNo: receipt.originalOrderNo,
      symbol: receipt.symbol, cancelQuantity,
      status: receipt.status, statusName: STATUS_NAME[receipt.status], orderedAt: receipt.orderedAt,
    })
  }),

  // ─── 주문내역 조회 ─────────────────────────────────────────────────────────
  http.get(`${URL_BASE}/history`, ({ request }) => {
    if (!hasAuth(request)) return unauthorized()
    ensureSeeded()
    const url = new URL(request.url)
    const accountNo = url.searchParams.get('accountNo') ?? ''
    const sideFilter = (url.searchParams.get('side') ?? 'ALL').toUpperCase()
    const fillFilter = (url.searchParams.get('fill') ?? 'ALL').toUpperCase()
    const symbol = url.searchParams.get('symbol') || null
    const startDate = url.searchParams.get('startDate') || null  // YYYY-MM-DD
    const endDate = url.searchParams.get('endDate') || null      // YYYY-MM-DD

    const matchSide = (o: OrderRow) =>
      sideFilter === 'ALL' || (sideFilter === 'BUY' ? o.side === 'buy' : o.side === 'sell')
    const matchFill = (o: OrderRow) => {
      if (fillFilter === 'FILLED') return o.filledQuantity > 0
      if (fillFilter === 'UNFILLED') return o.status !== 'CANCELED' && o.quantity - o.filledQuantity > 0
      return true
    }
    // 주문일자(orderedAt → YYYY-MM-DD) inclusive 범위 필터. null 경계는 무시.
    const matchDate = (o: OrderRow) => {
      const dt = new Date(o.orderedAt)
      const pad = (n: number) => String(n).padStart(2, '0')
      const d = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
      return (!startDate || d >= startDate) && (!endDate || d <= endDate)
    }

    const rows = store
      .filter(o => o.accountNo === accountNo)
      .filter(o => !RECEIPT_STATUSES.includes(o.status))
      .filter(o => !symbol || o.symbol === symbol)
      .filter(matchSide)
      .filter(matchFill)
      .filter(matchDate)
      .sort((a, b) => b.orderedAt.localeCompare(a.orderedAt))

    let totalQuantity = 0, totalFilledQuantity = 0, totalUnfilledQuantity = 0, totalCanceledQuantity = 0, totalFilledAmount = 0
    const items = rows.map(o => {
      const unfilled = Math.max(0, o.quantity - o.filledQuantity)
      totalQuantity += o.quantity
      totalFilledQuantity += o.filledQuantity
      totalFilledAmount += o.filledQuantity * o.filledPrice
      if (o.status === 'CANCELED') totalCanceledQuantity += unfilled
      else totalUnfilledQuantity += unfilled
      const dt = new Date(o.orderedAt)
      const pad = (n: number) => String(n).padStart(2, '0')
      return {
        orderDate: `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`,
        orderTime: `${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`,
        name: nameOf(o.symbol), symbol: o.symbol,
        quantity: o.quantity, price: o.price, orderAmount: o.quantity * o.price,
        filledQuantity: o.filledQuantity, filledPrice: o.filledPrice,
        side: o.side, sideName: SIDE_NAME[o.side],
        orderType: o.orderType, orderTypeName: TYPE_NAME[o.orderType],
        status: o.status, statusName: STATUS_NAME[o.status],
        orderNo: o.orderNo, orderedAt: o.orderedAt,
      }
    })

    return HttpResponse.json({
      summary: { totalQuantity, totalFilledQuantity, totalUnfilledQuantity, totalCanceledQuantity, totalFilledAmount },
      items,
    })
  }),

  // ─── 시드 (초기화 후 재시드) ────────────────────────────────────────────────
  http.post(`${URL_BASE}/seed`, ({ request }) => {
    if (!hasAuth(request)) return unauthorized()
    reseed()
    return new HttpResponse(null, { status: 200 })
  }),
]
