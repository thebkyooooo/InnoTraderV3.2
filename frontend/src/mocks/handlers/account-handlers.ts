import { http, HttpResponse } from 'msw'

// 계좌내역 API Mock — 백엔드 com.innotrader.account 미러링.
// /api/private/accounts/** (인증 필요: Authorization Bearer 헤더)

const URL_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/api/private/accounts`

interface Account {
  accountNo: string
  accountName: string
  typeCode: string
  typeName: string
  orderableAmount: number
}

// 시드 계좌 (백엔드와 동일)
const ACCOUNTS: Account[] = [
  { accountNo: '123-456789-01', accountName: '종합계좌',     typeCode: '01', typeName: '종합',     orderableAmount: 50_000_000 },
  { accountNo: '123-456789-02', accountName: '주식계좌',     typeCode: '02', typeName: '주식',     orderableAmount: 30_000_000 },
  { accountNo: '123-456789-05', accountName: 'CMA계좌',      typeCode: '05', typeName: 'CMA',      orderableAmount: 10_000_000 },
  { accountNo: '123-456789-11', accountName: '해외주식계좌', typeCode: '11', typeName: '해외주식', orderableAmount: 20_000_000 },
  { accountNo: '123-456789-61', accountName: '연금저축계좌', typeCode: '61', typeName: '연금저축', orderableAmount: 15_000_000 },
  { accountNo: '123-456789-71', accountName: 'ISA계좌',      typeCode: '71', typeName: 'ISA',      orderableAmount: 25_000_000 },
]

// 주문가능수량 계산용 시세/종목명 (stock-master-handlers와 동일 유니버스)
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

const hasAuth = (request: Request) => !!request.headers.get('Authorization')
const unauthorized = () =>
  HttpResponse.json({ code: 'AUTH_001', message: '인증이 필요합니다.' }, { status: 401 })
const accountNotFound = () =>
  HttpResponse.json({ code: 'ACCOUNT_001', message: '계좌를 찾을 수 없습니다.' }, { status: 404 })
const findAccount = (no: string) => ACCOUNTS.find(a => a.accountNo === no)

export const accountHandlers = [
  // ─── 계좌목록 조회 ──────────────────────────────────────────────────────────
  http.get(`${URL_BASE}/accountlist`, ({ request }) => {
    if (!hasAuth(request)) return unauthorized()
    return HttpResponse.json(
      ACCOUNTS.map(a => ({ accountNo: a.accountNo, accountName: a.accountName, typeCode: a.typeCode, typeName: a.typeName })),
    )
  }),

  // ─── 주문가능금액 조회 ───────────────────────────────────────────────────────
  http.get(`${URL_BASE}/amount`, ({ request }) => {
    if (!hasAuth(request)) return unauthorized()
    const accountNo = new URL(request.url).searchParams.get('accountNo') ?? ''
    const acc = findAccount(accountNo)
    if (!acc) return accountNotFound()
    return HttpResponse.json({ accountNo, orderableAmount: acc.orderableAmount })
  }),

  // ─── 주문가능수량 조회 ───────────────────────────────────────────────────────
  http.get(`${URL_BASE}/shares`, ({ request }) => {
    if (!hasAuth(request)) return unauthorized()
    const params = new URL(request.url).searchParams
    const accountNo = params.get('accountNo') ?? ''
    const symbol = params.get('symbol') ?? ''
    const acc = findAccount(accountNo)
    if (!acc) return accountNotFound()
    const stock = STOCKS[symbol]
    if (!stock) return HttpResponse.json({ code: 'COMMON_001', message: `종목을 찾을 수 없습니다: ${symbol}` }, { status: 400 })
    const shares = Math.floor(acc.orderableAmount / Math.max(1, stock.price))
    return HttpResponse.json({ accountNo, symbol, name: stock.name, orderableShares: shares })
  }),

  // ─── 기본 계좌 시드 (멱등) ──────────────────────────────────────────────────
  http.post(`${URL_BASE}/seed`, ({ request }) => {
    if (!hasAuth(request)) return unauthorized()
    return HttpResponse.json(
      ACCOUNTS.map(a => ({ accountNo: a.accountNo, accountName: a.accountName, typeCode: a.typeCode, typeName: a.typeName })),
    )
  }),
]
