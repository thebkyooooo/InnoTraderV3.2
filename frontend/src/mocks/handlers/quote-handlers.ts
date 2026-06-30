import { http, HttpResponse } from 'msw'
import { dailySeries, roundTick, tickSize } from './_dailySeries'
import { filledTicks } from './_intradaySeries'
import { STOCK_POOL } from '../data/stock-master-data'

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

// STOCK_POOL 350종목 전체로 SYMBOLS 빌드 (lstdShrs = marketCap 기반 추산)
const SYMBOLS = Object.fromEntries(
  STOCK_POOL.map(s => [s.symbol, {
    name:      s.name,
    market:    s.market,
    price:     s.price,
    prevDiff:  s.prevDiff,
    volume:    s.volume,
    marketCap: s.marketCap,
    lstdShrs:  Math.round(s.marketCap * 1_000_000 / s.price),
  }])
)

// ─── 일별 시세 ────────────────────────────────────────────────────────────────

export const quoteHandlers = [
  // ─── 현재가 ──────────────────────────────────────────────────────────────────

  http.get(`${BASE_URL}/price`, ({ request }) => {
    const symbol = new URL(request.url).searchParams.get('symbol') ?? ''
    const base   = SYMBOLS[symbol]
    if (!base) return HttpResponse.json({ message: '종목을 찾을 수 없습니다.' }, { status: 404 })

    const prevClose  = roundTick(base.price - base.prevDiff)
    const upperLimit = roundTick(Math.round(prevClose * 1.3))
    const lowerLimit = Math.max(100, roundTick(Math.round(prevClose * 0.7)))

    // 시가: 날짜 씨앗으로 당일 고정 (장중 변하지 않음, 호가 단위 정렬)
    const now     = new Date()
    const daySeed = now.getUTCFullYear() * 10000 + (now.getUTCMonth() + 1) * 100 + now.getUTCDate()
    const rDay    = rng(base.price * 53 + daySeed)
    const open    = Math.max(lowerLimit, Math.min(upperLimit, roundTick(Math.round(prevClose * (1 + (rDay() - 0.5) * 0.01)))))

    // 현재가: 2초마다 변동 시뮬레이션 (호가 단위 스냅)
    const nowTick = Math.floor(Date.now() / 2000)
    const rNow    = rng(base.price * 53 + nowTick)
    const r1 = rNow(), r2 = rNow(), r3 = rNow(), r4 = rNow()
    const price    = Math.max(lowerLimit, Math.min(upperLimit, roundTick(base.price + Math.round(base.price * (r1 - 0.5) * 0.006))))
    const prevDiff = price - prevClose
    const change   = Math.round(prevDiff * 1000 / (prevClose || 1)) / 10

    // 고가/저가: 전일대비 기반 당일 스윙 범위 (호가 단위 정렬)
    const swing = Math.max(Math.abs(base.prevDiff), Math.round(base.price * 0.005))
    const high  = Math.min(upperLimit, roundTick(Math.max(open, price) + Math.round(swing * (0.5 + r2 * 0.5))))
    const low   = Math.max(lowerLimit, roundTick(Math.min(open, price) - Math.round(swing * (0.5 + r3 * 0.5))))

    // 거래량: KST 장시간(9:00~15:30) 진행 비율로 스케일
    const kstMin   = (now.getUTCHours() * 60 + now.getUTCMinutes() + 9 * 60) % (24 * 60)
    const tradePct = kstMin < 540 ? 0.05 : kstMin > 930 ? 1.0 : (kstMin - 540) / 390
    const volume   = Math.round(base.volume * (tradePct * 0.85 + 0.1) * (0.95 + r4 * 0.1))
    const tradingAmount = Math.round(volume * price / 10000)

    return HttpResponse.json({
      symbol, name: base.name, market: base.market,
      price, prevDiff, change, volume, open, high, low, prevClose,
      upperLimit, lowerLimit, tradingAmount,
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
    const items = filledTicks(base.price, base.prevDiff, base.volume, totalMinutes, 9999, tickSize(base.price))

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
    const basePrice = roundTick(base.price)
    const tick = tickSize(basePrice)  // 가격대별 호가 단위
    const asks = Array.from({ length: 10 }, (_, i) => ({
      price: basePrice + tick * (i + 1),
      volume: Math.round(1000 + r() * 49000),
    }))
    const bids = Array.from({ length: 10 }, (_, i) => ({
      price: Math.max(tick, basePrice - tick * (i + 1)),
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
