import { http, HttpResponse } from 'msw'

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/api/public/market`

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

const rng = (seed: number) => {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
}

// ─── 목업 종목 풀 (100개) ──────────────────────────────────────────────────────

interface StockItem {
  rank: number
  symbol: string
  name: string
  market: string
  price: number
  prevDiff: number
  change: number
  marketCap: number
  volume: number
  tradingAmount: number
}

const buildStockPool = (): StockItem[] =>
  Array.from({ length: 100 }, (_, i) => {
    const r       = rng(i * 31 + 7777)
    const market  = i < 60 ? 'KOSPI' : 'KOSDAQ'
    const code    = String((i * 17 + 1000) % 1000000).padStart(6, '0')
    const price   = Math.round(5000 + r() * 495000)
    const prevDiff = Math.round(price * (r() - 0.5) * 0.06)
    const change  = Math.round((prevDiff / price) * 1000) / 10
    const marketCap = Math.round(price * (500000 + r() * 5000000) / 10000)
    const volume  = Math.round(100000 + r() * 10000000)
    const tradingAmount = Math.round(volume * price / 10000)
    return {
      rank: 0,
      symbol: code,
      name: `종목${i + 1}`,
      market,
      price,
      prevDiff,
      change,
      marketCap,
      volume,
      tradingAmount,
    }
  })

const STOCK_POOL = buildStockPool()

// ─── 핸들러 ───────────────────────────────────────────────────────────────────

export const marketHandlers = [

  // 1. GET /index
  http.get(`${BASE_URL}/index`, () => {
    const bases = [
      { code: 'KS11',   name: '코스피',      basePrice: 2550  },
      { code: 'KQ11',   name: '코스닥',      basePrice: 780   },
      { code: 'DJI',    name: 'DOW',         basePrice: 40000 },
      { code: 'COMP',   name: 'NASDAQ',      basePrice: 17000 },
      { code: 'INX',    name: 'S&P 500',     basePrice: 5200  },
      { code: 'N225',   name: '니케이 225',  basePrice: 39000 },
      { code: '000001', name: '상하이 종합', basePrice: 3100  },
      { code: 'HSI',    name: '항셍',        basePrice: 17500 },
    ]
    const items = bases.map(({ code, name, basePrice }, i) => {
      const r     = rng(basePrice * 13 + i + 1001)
      const price = Math.round((basePrice * (0.95 + r() * 0.1)) * 100) / 100
      const prevDiff = Math.round((price * (r() - 0.5) * 0.04) * 100) / 100
      const change   = Math.round((prevDiff / price) * 1000) / 10
      return { code, name, price, prevDiff, change }
    })
    return HttpResponse.json({ items })
  }),

  // 2. GET /exchange
  http.get(`${BASE_URL}/exchange`, () => {
    const bases = [
      { pair: 'USD/KRW', name: '미국 달러/원',       baseRate: 1350 },
      { pair: 'JPY/KRW', name: '일본 엔/원',         baseRate: 9.0  },
      { pair: 'EUR/KRW', name: '유로/원',            baseRate: 1450 },
      { pair: 'GBP/KRW', name: '영국 파운드/원',     baseRate: 1680 },
      { pair: 'CNY/KRW', name: '중국 위안(RMB)/원',  baseRate: 185  },
    ]
    const items = bases.map(({ pair, name, baseRate }, i) => {
      const r        = rng(Math.round(baseRate * 100) + i + 2002)
      const rate     = Math.round((baseRate * (0.98 + r() * 0.04)) * 100) / 100
      const prevDiff = Math.round((rate * (r() - 0.5) * 0.02) * 100) / 100
      const change   = Math.round((prevDiff / rate) * 10000) / 100
      return { pair, name, rate, prevDiff, change }
    })
    return HttpResponse.json({ items })
  }),

  // 3. GET /ranking/market-cap
  http.get(`${BASE_URL}/ranking/market-cap`, ({ request }) => {
    const market = new URL(request.url).searchParams.get('market') ?? 'KOSPI'
    const sorted = STOCK_POOL
      .filter(s => s.market === market.toUpperCase())
      .sort((a, b) => b.marketCap - a.marketCap)
      .map((s, i) => ({ ...s, rank: i + 1 }))
    return HttpResponse.json({ items: sorted })
  }),

  // 3. GET /ranking/volume
  http.get(`${BASE_URL}/ranking/volume`, ({ request }) => {
    const market = new URL(request.url).searchParams.get('market') ?? 'KOSPI'
    const sorted = STOCK_POOL
      .filter(s => s.market === market.toUpperCase())
      .sort((a, b) => b.volume - a.volume)
      .map((s, i) => ({ ...s, rank: i + 1 }))
    return HttpResponse.json({ items: sorted })
  }),

  // 3. GET /ranking/trading-amount
  http.get(`${BASE_URL}/ranking/trading-amount`, ({ request }) => {
    const market = new URL(request.url).searchParams.get('market') ?? 'KOSPI'
    const sorted = STOCK_POOL
      .filter(s => s.market === market.toUpperCase())
      .sort((a, b) => b.tradingAmount - a.tradingAmount)
      .map((s, i) => ({ ...s, rank: i + 1 }))
    return HttpResponse.json({ items: sorted })
  }),

  // 4. GET /advancing
  http.get(`${BASE_URL}/advancing`, ({ request }) => {
    const market = new URL(request.url).searchParams.get('market') ?? 'KOSPI'
    const items = STOCK_POOL
      .filter(s => s.market === market.toUpperCase() && s.change > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, 100)
      .map((s, i) => ({
        rank: i + 1,
        symbol: s.symbol,
        name: s.name,
        price: s.price,
        prevDiff: s.prevDiff,
        change: s.change,
      }))
    return HttpResponse.json({ items })
  }),

  // 4. GET /declining
  http.get(`${BASE_URL}/declining`, ({ request }) => {
    const market = new URL(request.url).searchParams.get('market') ?? 'KOSPI'
    const items = STOCK_POOL
      .filter(s => s.market === market.toUpperCase() && s.change < 0)
      .sort((a, b) => a.change - b.change)
      .slice(0, 100)
      .map((s, i) => ({
        rank: i + 1,
        symbol: s.symbol,
        name: s.name,
        price: s.price,
        prevDiff: s.prevDiff,
        change: s.change,
      }))
    return HttpResponse.json({ items })
  }),

  // 5. GET /trend
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
