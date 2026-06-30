import { http, HttpResponse } from 'msw'
import { STOCK_POOL, type StockItem } from '../data/stock-master-data'

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/api/public/market`

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

const rng = (seed: number) => {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
}

// market === 'ALL'이면 전체, 아니면 시장 필터
const byMarket = (market: string) =>
  market.toUpperCase() === 'ALL' ? STOCK_POOL : STOCK_POOL.filter(s => s.market === market.toUpperCase())

// ─── 핸들러 ───────────────────────────────────────────────────────────────────

export const marketHandlers = [

  // 1. GET /index
  http.get(`${BASE_URL}/index`, () => {
    // basePrice = 기준값(현재가). 전일대비/등락률만 변동 생성한다.
    const bases = [
      { code: 'KS11',   name: '코스피',      basePrice: 8713.42  },
      { code: 'KQ11',   name: '코스닥',      basePrice: 845.24   },
      { code: 'DJI',    name: 'DOW',         basePrice: 50866.78 },
      { code: 'COMP',   name: 'NASDAQ',      basePrice: 22881.38 },
      { code: 'INX',    name: 'S&P 500',     basePrice: 7383.74  },
      { code: 'N225',   name: '니케이 225',  basePrice: 69212.26 },
      { code: '000001', name: '상하이 종합', basePrice: 4096.47  },
      { code: 'HSI',    name: '항셍',        basePrice: 24961.95 },
    ]
    const items = bases.map(({ code, name, basePrice }, i) => {
      const r     = rng(Math.round(basePrice * 13) + i + 1001)
      const price = Math.round(basePrice * 100) / 100
      const prevDiff = Math.round((price * (r() - 0.5) * 0.04) * 100) / 100
      const change   = Math.round((prevDiff / price) * 1000) / 10
      return { code, name, price, prevDiff, change }
    })
    return HttpResponse.json(items)
  }),

  // 2. GET /exchange
  http.get(`${BASE_URL}/exchange`, () => {
    // baseRate = 기준 환율. 전일대비/등락률만 변동 생성한다.
    const bases = [
      { pair: 'USD/KRW', name: '미국 달러/원',       baseRate: 1548.80 },
      { pair: 'JPY/KRW', name: '일본 엔/원',         baseRate: 9.57    },
      { pair: 'EUR/KRW', name: '유로/원',            baseRate: 1758.8  },
      { pair: 'GBP/KRW', name: '영국 파운드/원',     baseRate: 2039.2  },
      { pair: 'CNY/KRW', name: '중국 위안(RMB)/원',  baseRate: 227.6   },
    ]
    const items = bases.map(({ pair, name, baseRate }, i) => {
      const r        = rng(Math.round(baseRate * 100) + i + 2002)
      const rate     = Math.round(baseRate * 100) / 100
      const prevDiff = Math.round((rate * (r() - 0.5) * 0.02) * 100) / 100
      const change   = Math.round((prevDiff / rate) * 10000) / 100
      return { pair, name, rate, prevDiff, change }
    })
    return HttpResponse.json(items)
  }),

  // 3. GET /ranking/market-cap
  http.get(`${BASE_URL}/ranking/market-cap`, ({ request }) => {
    const market = new URL(request.url).searchParams.get('market') ?? 'KOSPI'
    const sorted = byMarket(market)
      .sort((a, b) => b.marketCap - a.marketCap)
      .map((s, i) => ({ ...s, rank: i + 1 }))
    return HttpResponse.json(sorted)
  }),

  // 3. GET /ranking/volume
  http.get(`${BASE_URL}/ranking/volume`, ({ request }) => {
    const market = new URL(request.url).searchParams.get('market') ?? 'KOSPI'
    const sorted = byMarket(market)
      .sort((a, b) => b.volume - a.volume)
      .map((s, i) => ({ ...s, rank: i + 1 }))
    return HttpResponse.json(sorted)
  }),

  // 3. GET /ranking/trading-amount
  http.get(`${BASE_URL}/ranking/trading-amount`, ({ request }) => {
    const market = new URL(request.url).searchParams.get('market') ?? 'KOSPI'
    const sorted = byMarket(market)
      .sort((a, b) => b.tradingAmount - a.tradingAmount)
      .map((s, i) => ({ ...s, rank: i + 1 }))
    return HttpResponse.json(sorted)
  }),

  // 4. GET /advancing
  http.get(`${BASE_URL}/advancing`, ({ request }) => {
    const market = new URL(request.url).searchParams.get('market') ?? 'KOSPI'
    const items = byMarket(market)
      .filter(s => s.change > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, 100)
      .map((s, i) => ({
        rank: i + 1,
        symbol: s.symbol,
        name: s.name,
        market: s.market,
        price: s.price,
        prevDiff: s.prevDiff,
        change: s.change,
        volume: s.volume,
        marketCap: s.marketCap,
        tradingAmount: s.tradingAmount,
      }))
    return HttpResponse.json(items)
  }),

  // 4. GET /declining
  http.get(`${BASE_URL}/declining`, ({ request }) => {
    const market = new URL(request.url).searchParams.get('market') ?? 'KOSPI'
    const items = byMarket(market)
      .filter(s => s.change < 0)
      .sort((a, b) => a.change - b.change)
      .slice(0, 100)
      .map((s, i) => ({
        rank: i + 1,
        symbol: s.symbol,
        name: s.name,
        market: s.market,
        price: s.price,
        prevDiff: s.prevDiff,
        change: s.change,
        volume: s.volume,
        marketCap: s.marketCap,
        tradingAmount: s.tradingAmount,
      }))
    return HttpResponse.json(items)
  }),

  // 4. GET /gap-up — 갭상승 상위 100 (change>0, 결정적 보조기준 정렬)
  http.get(`${BASE_URL}/gap-up`, ({ request }) => {
    const market = new URL(request.url).searchParams.get('market') ?? 'KOSPI'
    const gapScore = (s: StockItem) => {
      // symbol 숫자 해시 가중치 + 등락률 (백엔드 gapScore 미러)
      const weight = (Number(s.symbol) % 1000) / 100
      return s.change + weight
    }
    const items = byMarket(market)
      .filter(s => s.change > 0)
      .sort((a, b) => gapScore(b) - gapScore(a))
      .slice(0, 100)
      .map((s, i) => ({
        rank: i + 1,
        symbol: s.symbol,
        name: s.name,
        market: s.market,
        price: s.price,
        prevDiff: s.prevDiff,
        change: s.change,
        volume: s.volume,
        marketCap: s.marketCap,
        tradingAmount: s.tradingAmount,
      }))
    return HttpResponse.json(items)
  }),

  // 4. GET /overheated — 투자심리과열 상위 100 (등락률 절대값 * 거래량)
  http.get(`${BASE_URL}/overheated`, ({ request }) => {
    const market = new URL(request.url).searchParams.get('market') ?? 'KOSPI'
    const overheatScore = (s: StockItem) => Math.abs(s.change) * s.volume
    const items = byMarket(market)
      .sort((a, b) => overheatScore(b) - overheatScore(a))
      .slice(0, 100)
      .map((s, i) => ({
        rank: i + 1,
        symbol: s.symbol,
        name: s.name,
        market: s.market,
        price: s.price,
        prevDiff: s.prevDiff,
        change: s.change,
        volume: s.volume,
        marketCap: s.marketCap,
        tradingAmount: s.tradingAmount,
      }))
    return HttpResponse.json(items)
  }),

  // 4. GET /trending — 인기검색 상위 10 (시장 무관, 거래대금 기준)
  http.get(`${BASE_URL}/trending`, () => {
    const items = [...STOCK_POOL]
      .sort((a, b) => b.tradingAmount - a.tradingAmount)
      .slice(0, 10)
      .map((s, i) => ({
        rank: i + 1,
        symbol: s.symbol,
        name: s.name,
        price: s.price,
        prevDiff: s.prevDiff,
        change: s.change,
      }))
    return HttpResponse.json(items)
  }),

  // 5. GET /daily-trends — 일별 투자동향 (커서 기반)
  http.get(`${BASE_URL}/daily-trends`, ({ request }) => {
    const url    = new URL(request.url)
    const market = (url.searchParams.get('market') ?? 'KOSPI').toUpperCase()
    const size   = Math.min(Number(url.searchParams.get('size') ?? '100'), 9999)
    const cursor = url.searchParams.get('cursor') // YYYY-MM-DD | null

    const basePrice = market === 'KOSDAQ' ? 845 : 8713
    const mSeed     = market === 'KOSDAQ' ? 999_999 : 0

    // 시작일: cursor 전날부터, 없으면 오늘부터
    const start = cursor ? new Date(cursor) : new Date()
    start.setDate(start.getDate() - (cursor ? 1 : 0))

    const items: object[] = []
    const d = new Date(start)

    while (items.length < size) {
      // 주말 제외
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        const dateSeed = d.getFullYear() * 10_000 + (d.getMonth() + 1) * 100 + d.getDate() + mSeed
        const r = rng(dateSeed)
        const prevDiff    = Math.round((r() - 0.5) * basePrice * 0.05)
        const changeRate  = Math.round((prevDiff / basePrice) * 10_000) / 100
        const closingPrice = basePrice + Math.round((r() - 0.48) * basePrice * 0.08)
        const volume      = Math.round(300_000_000 + r() * 300_000_000)
        const foreignNet  = Math.round((r() - 0.5) * 8_000)
        const individualNet = Math.round((r() - 0.5) * 10_000)
        const institutionNet = -(foreignNet + individualNet)
        const yyyy = d.getFullYear()
        const mm   = String(d.getMonth() + 1).padStart(2, '0')
        const dd   = String(d.getDate()).padStart(2, '0')
        items.push({ tradeDate: `${yyyy}-${mm}-${dd}`, closingPrice, prevDiff, changeRate, volume, foreignNet, individualNet, institutionNet })
      }
      d.setDate(d.getDate() - 1)
    }

    const nextCursor = items.length === size
      ? (items[items.length - 1] as { tradeDate: string }).tradeDate
      : null
    return HttpResponse.json({ items, nextCursor })
  }),

  // 6. GET /trend
  http.get(`${BASE_URL}/trend`, ({ request }) => {
    const url    = new URL(request.url)
    const market = url.searchParams.get('market') ?? 'KOSPI'
    const seed   = market === 'KOSDAQ' ? 2002 : 1001
    const r      = rng(seed)
    const foreign     = Math.round((r() - 0.5) * 10000)
    const individual  = Math.round(-(foreign * 0.7 + (r() - 0.5) * 2000))
    const institution = Math.round(-(foreign + individual) * 0.5)
    return HttpResponse.json({ foreign, individual, institution })
  }),

  // 6. GET /breadth
  http.get(`${BASE_URL}/breadth`, ({ request }) => {
    const url    = new URL(request.url)
    const market = url.searchParams.get('market') ?? 'KOSPI'
    const offset = market === 'KOSDAQ' ? 200 : 0

    // 200개 목업 종목 생성
    const stocks = Array.from({ length: 200 }, (_, i) => {
      const idx  = offset + i
      const r    = rng(idx * 31 + 9999)
      const code = String((idx * 17 + 1000) % 1000000).padStart(6, '0')
      const price = Math.round(5000 + r() * 495000)
      let change  = Math.round((r() - 0.5) * 80) / 2  // -20 ~ +20 범위 분포
      // 5개는 보합(change=0)으로 강제 설정
      if (i < 5) change = 0
      // 상하한가 일부 설정
      if (i === 5)  change = 29.9
      if (i === 6)  change = 30.0
      if (i === 7)  change = 29.95
      if (i === 195) change = -30.0
      if (i === 196) change = -29.9
      if (i === 197) change = -29.95
      if (i === 198) change = -30.0
      if (i === 199) change = -29.9
      const prevDiff = Math.round(price * change / 100)
      return { symbol: code, name: `종목${idx + 1}`, price, prevDiff, change }
    })

    const upperLimitStocks = stocks.filter(s => s.change >= 29.9)
    const risingStocks     = stocks.filter(s => s.change > 0 && s.change < 29.9)
    const flatStocks       = stocks.filter(s => s.change === 0)
    const fallingStocks    = stocks.filter(s => s.change < 0 && s.change > -29.9)
    const lowerLimitStocks = stocks.filter(s => s.change <= -29.9)

    return HttpResponse.json({
      upperLimit:       upperLimitStocks.length,
      rising:           risingStocks.length,
      flat:             flatStocks.length,
      falling:          fallingStocks.length,
      lowerLimit:       lowerLimitStocks.length,
      upperLimitStocks: upperLimitStocks.slice(0, 10),
      risingStocks:     risingStocks.slice(0, 10),
      flatStocks:       flatStocks.slice(0, 5),
      fallingStocks:    fallingStocks.slice(0, 10),
      lowerLimitStocks: lowerLimitStocks.slice(0, 10),
    })
  }),
]
