import { http, HttpResponse } from 'msw'
import { dailySeries } from './_dailySeries'
import { filledTicks } from './_intradaySeries'

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/api/public/quotes`

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

const decodeCursor = (cursor: string | null): number => {
  if (!cursor) return 0
  try { return parseInt(atob(cursor)) } catch { return 0 }
}
const encodeCursor = (offset: number): string => btoa(String(offset))

const rng = (seed: number) => {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
}

const SYMBOLS: Record<string, { name: string; market: string; price: number; prevDiff: number; volume: number; marketCap: number; lstdShrs: number }> = {
  '005930': { name: '삼성전자',   market: 'KOSPI',  price: 72300,  prevDiff: 870,   volume: 12456789, marketCap: 431000000, lstdShrs: 5846278608 },
  '000660': { name: 'SK하이닉스', market: 'KOSPI',  price: 198500, prevDiff: -1596, volume: 3214567,  marketCap: 144000000, lstdShrs: 712702365 },
  '035420': { name: 'NAVER',     market: 'KOSDAQ', price: 215000, prevDiff: 1075,  volume: 987654,   marketCap: 35000000,  lstdShrs: 164263395 },
}

// ─── 일별 시세 ────────────────────────────────────────────────────────────────

export const quoteHandlers = [
  // ─── 현재가 ──────────────────────────────────────────────────────────────────

  http.get(`${BASE_URL}/price`, ({ request }) => {
    const symbol = new URL(request.url).searchParams.get('symbol') ?? ''
    const base   = SYMBOLS[symbol]
    if (!base) return HttpResponse.json({ message: '종목을 찾을 수 없습니다.' }, { status: 404 })

    const r         = rng(base.price * 53)
    const prevClose = base.price - base.prevDiff
    const open      = Math.max(100, Math.round(prevClose * (1 + (r() - 0.5) * 0.01)))
    const high      = Math.max(base.price, open) + Math.round(base.price * 0.005)
    const low       = Math.max(100, Math.min(base.price, open) - Math.round(base.price * 0.005))
    const change    = Math.round(base.prevDiff * 1000 / (prevClose || 1)) / 10

    return HttpResponse.json({
      symbol,
      name:          base.name,
      market:        base.market,
      price:         base.price,
      prevDiff:      base.prevDiff,
      change,
      volume:        base.volume,
      open,
      high,
      low,
      prevClose,
      upperLimit:    Math.round(prevClose * 1.3),
      lowerLimit:    Math.round(prevClose * 0.7),
      tradingAmount: Math.round(base.volume * base.price / 10000),
    })
  }),

  http.get(`${BASE_URL}/daily`, ({ request }) => {
    const url    = new URL(request.url)
    const symbol = url.searchParams.get('symbol') ?? ''
    const size   = Math.min(parseInt(url.searchParams.get('size') ?? '100'), 9999)
    const offset = decodeCursor(url.searchParams.get('cursor'))
    const base   = SYMBOLS[symbol]
    if (!base) return HttpResponse.json({ message: '종목을 찾을 수 없습니다.' }, { status: 404 })

    // 일별 그리드 · 차트 일봉 · 투자동향이 공유하는 공통 일봉 시리즈
    const items = dailySeries(base.price, base.prevDiff, base.volume, 3000).map(b => ({
      date: b.date, price: b.close, prevDiff: b.prevDiff, change: b.change,
      open: b.open, high: b.high, low: b.low, volume: b.volume, turnoverMan: b.turnoverMan,
    }))

    const page = items.slice(offset, offset + size)
    const hasNext = offset + size < items.length
    return HttpResponse.json({ items: page, nextCursor: hasNext ? encodeCursor(offset + size) : null, hasNext })
  }),

  // ─── 체결 시세 ──────────────────────────────────────────────────────────────

  http.get(`${BASE_URL}/filled`, ({ request }) => {
    const url    = new URL(request.url)
    const symbol = url.searchParams.get('symbol') ?? ''
    const size   = Math.min(parseInt(url.searchParams.get('size') ?? '100'), 9999)
    const offset = decodeCursor(url.searchParams.get('cursor'))
    const base   = SYMBOLS[symbol]
    if (!base) return HttpResponse.json({ message: '종목을 찾을 수 없습니다.' }, { status: 404 })

    // 09:00 ~ 현재 시각(KST)까지만 생성. 장 시작 전=0, 장 마감 후=390분(15:30)으로 클램프
    const nowUtc   = new Date()
    const kstMin   = (nowUtc.getUTCHours() * 60 + nowUtc.getUTCMinutes() + 9 * 60) % (24 * 60)
    const OPEN_MIN = 9 * 60, CLOSE_MIN = 15 * 60 + 30
    const totalMinutes = kstMin < OPEN_MIN ? 0 : kstMin > CLOSE_MIN ? 390 : kstMin - OPEN_MIN

    // 체결도 오늘 일봉(시가)→현재가 브리지로 생성되어 최근 체결가 = 현재가 (최신순)
    const items = filledTicks(base.price, base.prevDiff, base.volume, totalMinutes, 9999, 50)

    const page = items.slice(offset, offset + size)
    const hasNext = offset + size < items.length
    return HttpResponse.json({ items: page, nextCursor: hasNext ? encodeCursor(offset + size) : null, hasNext })
  }),

  // ─── 호가 ───────────────────────────────────────────────────────────────────

  http.get(`${BASE_URL}/hoga`, ({ request }) => {
    const symbol = new URL(request.url).searchParams.get('symbol') ?? ''
    const base   = SYMBOLS[symbol]
    if (!base) return HttpResponse.json({ message: '종목을 찾을 수 없습니다.' }, { status: 404 })

    const r = rng(base.price * 41)
    const asks = Array.from({ length: 10 }, (_, i) => ({
      price: base.price + 50 * (i + 1),
      volume: Math.round(1000 + r() * 49000),
    }))
    const bids = Array.from({ length: 10 }, (_, i) => ({
      price: Math.max(50, base.price - 50 * (i + 1)),
      volume: Math.round(1000 + r() * 49000),
    }))
    return HttpResponse.json({ asks, bids })
  }),

  // ─── 투자동향 ────────────────────────────────────────────────────────────────

  http.get(`${BASE_URL}/trends`, ({ request }) => {
    const url    = new URL(request.url)
    const symbol = url.searchParams.get('symbol') ?? ''
    const size   = Math.min(parseInt(url.searchParams.get('size') ?? '100'), 9999)
    const offset = decodeCursor(url.searchParams.get('cursor'))
    const base   = SYMBOLS[symbol]
    if (!base) return HttpResponse.json({ message: '종목을 찾을 수 없습니다.' }, { status: 404 })

    // 날짜·종가·전일대비·거래량은 일별 시세와 동일한 공통 시리즈, 순매수만 별도 파생
    const items = dailySeries(base.price, base.prevDiff, base.volume, 3000).map((b, i) => {
      const r = rng(base.price * 43 + i)
      const vol = b.volume
      const foreign     = Math.round((r() - 0.5) * vol * 0.4)
      const individual  = Math.round((r() - 0.5) * vol * 0.6)
      const institution = -foreign - individual + Math.round((r() - 0.5) * vol * 0.1)
      return { date: b.date, price: b.close, prevDiff: b.prevDiff, change: b.change,
               volume: vol, foreign, individual, institution }
    })

    const page = items.slice(offset, offset + size)
    const hasNext = offset + size < items.length
    return HttpResponse.json({ items: page, nextCursor: hasNext ? encodeCursor(offset + size) : null, hasNext })
  }),

  // ─── 종목 상세 ──────────────────────────────────────────────────────────────

  http.get(`${BASE_URL}/detail`, ({ request }) => {
    const symbol = new URL(request.url).searchParams.get('symbol') ?? ''
    const base   = SYMBOLS[symbol]
    if (!base) return HttpResponse.json({ message: '종목을 찾을 수 없습니다.' }, { status: 404 })

    const r = rng(base.price * 47)
    const per = Math.round((8 + r() * 32) * 10) / 10
    const pbr = Math.round((0.3 + r() * 3) * 100) / 100
    return HttpResponse.json({
      name: base.name, symbol,
      marketCap: base.marketCap, lstdShrs: base.lstdShrs,
      parValue: [100, 500, 1000, 5000][Math.floor(r() * 4)],
      upperLimit: Math.round(base.price * 1.3),
      lowerLimit: Math.round(base.price * 0.7),
      high52w: Math.round(base.price * (1.1 + r() * 0.4)),
      low52w:  Math.round(base.price * (0.5 + r() * 0.3)),
      per, eps: Math.round(base.price / per),
      pbr, bps: Math.round(base.price / pbr),
    })
  }),
]
