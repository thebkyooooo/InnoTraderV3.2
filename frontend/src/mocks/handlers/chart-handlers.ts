import { http, HttpResponse } from 'msw'
import { dailySeries, periodSeries, type Period } from './_dailySeries'
import { minuteCandles } from './_intradaySeries'

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/api/public/chart`

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

const decodeCursor = (cursor: string | null): number => {
  if (!cursor) return 0
  try { return parseInt(atob(cursor)) } catch { return 0 }
}
const encodeCursor = (offset: number): string => btoa(String(offset))

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

    // 일봉(D)은 공통 시리즈를, 주/월/년봉은 그 일봉을 집계해 사용
    const bars = type === 'D'
      ? dailySeries(base.price, base.prevDiff, base.volume, pool)
      : periodSeries(base.price, base.prevDiff, base.volume, type as Period, pool)
    const items = bars.map(b => ({
      date: b.date, price: b.close, prevDiff: b.prevDiff, change: b.change,
      open: b.open, high: b.high, low: b.low, volume: b.volume, turnoverMan: b.turnoverMan,
    }))

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

    // 분봉은 일봉(시가→종가) 브리지로 생성되어 일봉과 일관되며 최신 봉 종가 = 현재가
    const items = minuteCandles(base.price, base.prevDiff, base.volume, intervalMin, 9999).map(b => ({
      time: b.time, price: b.close, prevDiff: b.prevDiff, change: b.change,
      open: b.open, high: b.high, low: b.low, filledVolume: b.filledVolume, volume: b.volume,
    }))

    const page = items.slice(offset, offset + size)
    const hasNext = offset + size < items.length
    return HttpResponse.json({ items: page, nextCursor: hasNext ? encodeCursor(offset + size) : null, hasNext })
  }),
]
