import { http, HttpResponse } from 'msw'

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

    const items = Array.from({ length: 3000 }, (_, i) => {
      const r = rng(base.price * 31 + i)
      const price = Math.max(100, Math.round(base.price * (0.7 + r() * 0.6)))
      const prev  = Math.max(100, Math.round(price * (1 - (r() - 0.5) * 0.04)))
      const diff  = price - prev
      const open  = Math.max(100, Math.round(prev * (1 + (r() - 0.5) * 0.01)))
      const high  = Math.max(price, open) + Math.round(price * 0.005)
      const low   = Math.max(100, Math.min(price, open) - Math.round(price * 0.005))
      const vol   = Math.round(base.volume * (0.5 + r()))
      const d = new Date(); d.setDate(d.getDate() - i)
      return { date: d.toISOString().slice(0, 10).replace(/-/g, ''), price, prevDiff: diff,
               change: Math.round(diff * 1000 / prev) / 10, open, high, low, volume: vol, turnoverMan: Math.round(vol * price / 10000) }
    })

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

    let cumVol = 0
    const items = Array.from({ length: 9999 }, (_, i) => {
      const r = rng(base.price * 37 + i)
      const price = Math.max(100, Math.round(base.price * (1 + (r() - 0.5) * 0.006)))
      const filledVolume = Math.max(1, Math.round(r() * 1000))
      cumVol += filledVolume
      const minOff = Math.floor(i * totalMinutes / 9998)
      const h = 9 + Math.floor(minOff / 60)
      const m = minOff % 60
      const s = Math.floor(r() * 60)
      return { time: `${String(h).padStart(2,'0')}${String(m).padStart(2,'0')}${String(s).padStart(2,'0')}`,
               price, prevDiff: price - (base.price - base.prevDiff),
               change: Math.round((price - (base.price - base.prevDiff)) * 1000 / (base.price - base.prevDiff + 1)) / 10,
               askPrice: price + 50, bidPrice: price - 50, filledVolume,
               fillStrength: Math.max(0, Math.min(200, 50 + (r() - 0.5) * 60)), volume: cumVol }
    })

    items.reverse() // 가장 최근 체결(현재 시각, 마감 후엔 15:30)이 먼저 오도록 역순 정렬

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

    const items = Array.from({ length: 3000 }, (_, i) => {
      const r = rng(base.price * 43 + i)
      const price = Math.max(100, Math.round(base.price * (0.7 + r() * 0.6)))
      const prev  = Math.max(100, Math.round(price * (1 - (r() - 0.5) * 0.04)))
      const diff  = price - prev
      const vol   = Math.round(base.volume * (0.5 + r()))
      const foreign     = Math.round((r() - 0.5) * vol * 0.4)
      const individual  = Math.round((r() - 0.5) * vol * 0.6)
      const institution = -foreign - individual
      const d = new Date(); d.setDate(d.getDate() - i)
      return { date: d.toISOString().slice(0, 10).replace(/-/g, ''), price, prevDiff: diff,
               change: Math.round(diff * 1000 / prev) / 10, volume: vol, foreign, individual, institution }
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
