import { http, HttpResponse } from 'msw'

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/api/public/master`

interface StockSummary { name: string; symbol: string; market: string }
interface StockDetail extends StockSummary {
  price: number; prevDiff: number; change: number
  open: number; high: number; low: number
  volume: number; turnoverMan: number
}

const MOCK_STOCKS: StockDetail[] = [
  { name: '삼성전자',    symbol: '005930', market: 'KOSPI',  price: 72300,   prevDiff: 870,   change: 1.2,  open: 71430,  high: 73023,  low: 70717,  volume: 12456789, turnoverMan: 90122499270 / 10000 },
  { name: 'SK하이닉스',  symbol: '000660', market: 'KOSPI',  price: 198500,  prevDiff: -1596, change: -0.8, open: 200096, high: 200497, low: 196509, volume: 3214567,  turnoverMan: 638141029500 / 10000 },
  { name: 'NAVER',      symbol: '035420', market: 'KOSPI',  price: 215000,  prevDiff: 1075,  change: 0.5,  open: 213925, high: 217150, low: 211775, volume: 987654,   turnoverMan: 212345610000 / 10000 },
  { name: 'Kakao',      symbol: '035720', market: 'KOSPI',  price: 48500,   prevDiff: -1043, change: -2.1, open: 49543,  high: 49543,  low: 47985,  volume: 4567890,  turnoverMan: 221542665000 / 10000 },
  { name: 'LG에너지솔루션', symbol: '373220', market: 'KOSPI',  price: 385000, prevDiff: 12320, change: 3.2, open: 372680, high: 388850, low: 368928, volume: 567890,   turnoverMan: 218637650000 / 10000 },
  { name: '현대자동차',  symbol: '005380', market: 'KOSPI',  price: 245000,  prevDiff: 1960,  change: 0.8,  open: 243040, high: 247450, low: 240610, volume: 1234567,  turnoverMan: 302469115000 / 10000 },
  { name: '에코프로',    symbol: '086520', market: 'KOSDAQ', price: 98000,   prevDiff: 1960,  change: 2.0,  open: 96040,  high: 98980,  low: 95079,  volume: 987654,   turnoverMan: 96790092000 / 10000 },
  { name: 'HLB',        symbol: '028300', market: 'KOSDAQ', price: 67800,   prevDiff: -678,  change: -1.0, open: 68478,  high: 68478,  low: 67122,  volume: 2345678,  turnoverMan: 159036764400 / 10000 },
]

const toSummary = (s: StockDetail): StockSummary => ({ name: s.name, symbol: s.symbol, market: s.market })

export const stockMasterHandlers = [
  // GET /api/public/master/stocks?market=
  http.get(`${BASE_URL}/stocks`, ({ request }) => {
    const market = new URL(request.url).searchParams.get('market')
    if (market && market.toUpperCase() !== 'ALL') {
      return HttpResponse.json(MOCK_STOCKS.filter(s => s.market === market.toUpperCase()).map(toSummary))
    }
    return HttpResponse.json(MOCK_STOCKS.map(toSummary))
  }),

  // GET /api/public/master/stocks/batch?symbols=
  http.get(`${BASE_URL}/stocks/batch`, ({ request }) => {
    const symbols = new URL(request.url).searchParams.get('symbols') ?? ''
    const symbolSet = new Set(symbols.split(',').map(s => s.trim()))
    return HttpResponse.json(MOCK_STOCKS.filter(s => symbolSet.has(s.symbol)))
  }),

  // GET /api/public/master/stocks/:symbol
  http.get(`${BASE_URL}/stocks/:symbol`, ({ params }) => {
    const stock = MOCK_STOCKS.find(s => s.symbol === params.symbol)
    if (!stock) {
      return HttpResponse.json({ message: '종목을 찾을 수 없습니다.' }, { status: 404 })
    }
    return HttpResponse.json(stock)
  }),
]
