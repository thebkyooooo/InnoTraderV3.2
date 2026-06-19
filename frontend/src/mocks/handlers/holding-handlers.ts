import { http, HttpResponse } from 'msw'

// 계좌잔고 API Mock — 백엔드 com.innotrader.holding 미러링.
// /api/private/holdings/** (인증 필요: Authorization Bearer 헤더)

const URL_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/api/private/holdings`

// 시세/종목명 (stock-master-handlers 8종목 유니버스)
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

// 계좌 예수금(주문가능금액) — account-handlers와 동일
const CASH: Record<string, number> = {
  '123-456789-01': 50_000_000,
  '123-456789-02': 30_000_000,
  '123-456789-05': 10_000_000,
  '123-456789-11': 20_000_000,
  '123-456789-61': 15_000_000,
  '123-456789-71': 25_000_000,
}

interface Hold { symbol: string; quantity: number; avgPrice: number }

// 계좌별 보유종목 시드 (MSW 유니버스가 8종목이라 종목 수는 축소 미러)
const HOLDINGS: Record<string, Hold[]> = {
  '123-456789-01': [
    { symbol: '005930', quantity: 50, avgPrice: 65000 },
    { symbol: '000660', quantity: 10, avgPrice: 210000 },
    { symbol: '035420', quantity: 20, avgPrice: 200000 },
    { symbol: '005380', quantity: 8,  avgPrice: 230000 },
    { symbol: '373220', quantity: 3,  avgPrice: 400000 },
  ],
  '123-456789-02': [
    { symbol: '035720', quantity: 100, avgPrice: 52000 },
    { symbol: '086520', quantity: 15,  avgPrice: 90000 },
    { symbol: '028300', quantity: 30,  avgPrice: 70000 },
  ],
  '123-456789-71': [],
}

const hasAuth = (request: Request) => !!request.headers.get('Authorization')
const unauthorized = () =>
  HttpResponse.json({ code: 'AUTH_001', message: '인증이 필요합니다.' }, { status: 401 })

function buildHoldings(accountNo: string) {
  const holds = HOLDINGS[accountNo] ?? []
  let totalEval = 0, principal = 0
  const items = holds.map(h => {
    const stock = STOCKS[h.symbol]
    const price = stock?.price ?? h.avgPrice
    const name = stock?.name ?? h.symbol
    const evalAmount = h.quantity * price
    const cost = h.quantity * h.avgPrice
    const profit = evalAmount - cost
    const profitRate = cost === 0 ? 0 : Math.round((profit * 10000) / cost) / 100
    totalEval += evalAmount
    principal += cost
    return { name, symbol: h.symbol, quantity: h.quantity, avgPrice: h.avgPrice, currentPrice: price, evalAmount, profit, profitRate }
  })
  const totalProfit = totalEval - principal
  const totalProfitRate = principal === 0 ? 0 : Math.round((totalProfit * 10000) / principal) / 100
  const totalAssets = totalEval + (CASH[accountNo] ?? 0)
  return {
    summary: { totalAssets, totalEvalAmount: totalEval, principal, totalProfit, totalProfitRate },
    items,
  }
}

export const holdingHandlers = [
  // ─── 주식잔고 조회 ──────────────────────────────────────────────────────────
  http.get(`${URL_BASE}/holdings`, ({ request }) => {
    if (!hasAuth(request)) return unauthorized()
    const accountNo = new URL(request.url).searchParams.get('accountNo') ?? ''
    return HttpResponse.json(buildHoldings(accountNo))
  }),

  // ─── 보유종목 시드 (멱등) ───────────────────────────────────────────────────
  http.post(`${URL_BASE}/seed`, ({ request }) => {
    if (!hasAuth(request)) return unauthorized()
    return new HttpResponse(null, { status: 200 })
  }),
]
