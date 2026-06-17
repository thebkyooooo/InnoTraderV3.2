import { http, HttpResponse } from 'msw'

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/api/public/chart`

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

const SYMBOLS: Record<string, { name: string; price: number; prevDiff: number; volume: number }> = {
  '005930': { name: '삼성전자',   price: 72300,  prevDiff: 870,   volume: 12456789 },
  '000660': { name: 'SK하이닉스', price: 198500, prevDiff: -1596, volume: 3214567  },
  '035420': { name: 'NAVER',     price: 215000, prevDiff: 1075,  volume: 987654   },
}

// ─── 일별 차트 ────────────────────────────────────────────────────────────────

export const chartHandlers = [
  http.get(`${BASE_URL}/daily`, ({ request }) => {
    const url    = new URL(request.url)
    const symbol = url.searchParams.get('symbol') ?? ''
    const type   = (url.searchParams.get('type') ?? 'D').toUpperCase()
    const offset = decodeCursor(url.searchParams.get('cursor'))
    const base   = SYMBOLS[symbol]
    if (!base) return HttpResponse.json({ message: '종목을 찾을 수 없습니다.' }, { status: 404 })

    // 타입별 풀 크기
    const pool = type === 'Y' ? 50 : type === 'M' ? 600 : type === 'W' ? 2600 : 9999
    // 타입별 기본 size
    const defaultSize = type === 'Y' ? 47 : type === 'M' ? 72 : 360
    const size = Math.min(parseInt(url.searchParams.get('size') ?? String(defaultSize)), 9999)

    const volMul = type === 'Y' ? 252 : type === 'M' ? 22 : type === 'W' ? 5 : 1
    const today = new Date()
    const prevDayClose = base.price - base.prevDiff

    const items = Array.from({ length: pool }, (_, i) => {
      const r = rng(base.price * 53 + i + type.charCodeAt(0))
      const d = new Date(today)
      if      (type === 'D') d.setDate(d.getDate() - i)
      else if (type === 'W') d.setDate(d.getDate() - i * 7)
      else if (type === 'M') d.setMonth(d.getMonth() - i)
      else                   d.setFullYear(d.getFullYear() - i)
      const date = d.toISOString().slice(0, 10).replace(/-/g, '')

      const price  = Math.max(100, Math.round(base.price * (0.7 + r() * 0.6)))
      const prev   = Math.max(100, Math.round(price * (1 - (r() - 0.5) * 0.04)))
      const diff   = price - prev
      const open   = Math.max(100, Math.round(prev * (1 + (r() - 0.5) * 0.01)))
      const high   = Math.max(price, open) + Math.round(price * 0.005)
      const low    = Math.max(100, Math.min(price, open) - Math.round(price * 0.005))
      const vol    = Math.round(base.volume * (0.5 + r()) * volMul)
      return { date, price, prevDiff: diff,
               change: Math.round(diff * 1000 / (prev + 1)) / 10,
               open, high, low, volume: vol, turnoverMan: Math.round(vol * price / 10000) }
    })

    const page = items.slice(offset, offset + size)
    const hasNext = offset + size < items.length
    return HttpResponse.json({ items: page, nextCursor: hasNext ? encodeCursor(offset + size) : null, hasNext })
  }),

  // ─── 분별 차트 ──────────────────────────────────────────────────────────────

  http.get(`${BASE_URL}/time`, ({ request }) => {
    const url         = new URL(request.url)
    const symbol      = url.searchParams.get('symbol') ?? ''
    const intervalMin = parseInt(url.searchParams.get('type') ?? '1')
    const size        = Math.min(parseInt(url.searchParams.get('size') ?? '360'), 9999)
    const offset      = decodeCursor(url.searchParams.get('cursor'))
    const base        = SYMBOLS[symbol]
    if (!base) return HttpResponse.json({ message: '종목을 찾을 수 없습니다.' }, { status: 404 })

    const candlesPerDay  = Math.floor(390 / intervalMin)
    const prevDayClose   = base.price - base.prevDiff
    let cumVol = 0

    const items = Array.from({ length: 9999 }, (_, i) => {
      const r           = rng(base.price * 59 + i + intervalMin)
      const candleInDay = i % candlesPerDay
      const minFromOpen = (candlesPerDay - 1 - candleInDay) * intervalMin
      const h = 9 + Math.floor(minFromOpen / 60)
      const m = minFromOpen % 60
      const time = `${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`

      const price       = Math.max(100, Math.round(base.price * (1 + (r() - 0.5) * 0.004)))
      const open        = Math.max(100, Math.round(price * (1 + (r() - 0.5) * 0.002)))
      const high        = Math.max(price, open) + Math.round(price * 0.002)
      const low         = Math.max(100, Math.min(price, open) - Math.round(price * 0.002))
      const filledVolume = Math.max(1, Math.round(r() * base.volume / candlesPerDay * 2))
      if (candleInDay === 0) cumVol = 0
      cumVol += filledVolume

      const diff = price - prevDayClose
      return { time, price, prevDiff: diff,
               change: Math.round(diff * 1000 / (prevDayClose + 1)) / 10,
               open, high, low, filledVolume, volume: cumVol }
    })

    const page = items.slice(offset, offset + size)
    const hasNext = offset + size < items.length
    return HttpResponse.json({ items: page, nextCursor: hasNext ? encodeCursor(offset + size) : null, hasNext })
  }),
]
