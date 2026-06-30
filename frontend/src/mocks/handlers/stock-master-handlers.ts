import { http, HttpResponse } from 'msw'
import { STOCK_POOL } from '../data/stock-master-data'
import { roundTick } from './_dailySeries'

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/api/public/master`

interface StockSummary { name: string; symbol: string; market: string }
interface StockDetail extends StockSummary {
  price: number; prevDiff: number; change: number
  open: number; high: number; low: number
  volume: number; turnoverMan: number
}

// 틱 정렬된 단일 소스(STOCK_POOL)에서 파생 → quotes/market 등 다른 핸들러와 동일 기준 sync.
// 시가/고가/저가는 백엔드 StockMaster 근사식과 동일하게 호가 단위로 정렬해 계산.
const MOCK_STOCKS: StockDetail[] = STOCK_POOL.map(s => {
  const prevClose = s.price - s.prevDiff
  const wick = Math.abs(Math.trunc(s.price / 100))
  return {
    name: s.name, symbol: s.symbol, market: s.market,
    price: s.price, prevDiff: s.prevDiff, change: s.change,
    open: prevClose,
    high: roundTick(Math.max(s.price, prevClose) + wick),
    low:  roundTick(Math.min(s.price, prevClose) - wick),
    volume: s.volume,
    turnoverMan: s.tradingAmount,
  }
})

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
