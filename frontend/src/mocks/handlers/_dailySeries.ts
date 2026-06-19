// 일자별(일봉) 합성 시세 생성기 — 일별 그리드 · 차트 일봉(D) · 투자동향이 공유.
// 백엔드 com.innotrader.common.support.MockDailySeries 와 동일한 로직(미러링).
//
// - 오늘(0) 종가 = 현재가(price), 어제(1) 종가 = 전일종가(price - prevDiff)로 앵커
// - 각 인덱스 값은 인덱스에만 의존하므로 count가 달라도 겹치는 날짜는 동일

const lcg = (seed: number) => {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff }
}

export interface DailyBar {
  date: string         // yyyyMMdd
  close: number        // 종가
  prevDiff: number     // 전일대비
  change: number       // 등락률(%)
  open: number
  high: number
  low: number
  volume: number
  turnoverMan: number  // 거래금액(만)
}

export function dailySeries(price: number, prevDiff: number, volume: number, count: number): DailyBar[] {
  if (count <= 0) return []

  // 종가 체인 (단일 스트림): 오늘=price, 어제=전일종가, 그 이전은 랜덤워크.
  // 인덱스마다 재시드하면 연속 seed의 첫 난수가 상관되어 추이가 매끈한 곡선이 되므로
  // 단일 스트림을 순차적으로 뽑는다. (count가 달라도 겹치는 인덱스는 동일)
  const rc = lcg(price * 53 + 1)
  const closes = new Array<number>(count + 1)
  closes[0] = price
  closes[1] = Math.max(100, price - prevDiff)
  for (let i = 2; i <= count; i++) {
    const dc = (rc() - 0.5) * 0.04
    closes[i] = Math.max(100, Math.round(closes[i - 1] * (1 + dc)))
  }

  // 바 속성 (별도 단일 스트림): 시가/고가/저가/거래량
  const rb = lcg(price * 59 + 7)
  const today = new Date()
  const out: DailyBar[] = []
  for (let i = 0; i < count; i++) {
    const close     = closes[i]
    const prevClose = closes[i + 1]
    const open = Math.max(100, Math.round(prevClose * (1 + (rb() - 0.5) * 0.01)))
    const high = Math.max(close, open) + Math.round((close / 100) * rb())
    const low  = Math.max(100, Math.min(close, open) - Math.round((close / 100) * rb()))
    const vol  = Math.max(1000, Math.round(volume * (0.5 + rb())))
    const diff = close - prevClose
    const chg  = prevClose === 0 ? 0 : Math.round(diff * 1000 / prevClose) / 10
    const d = new Date(today); d.setDate(d.getDate() - i)
    out.push({
      date: d.toISOString().slice(0, 10).replace(/-/g, ''),
      close, prevDiff: diff, change: chg, open, high, low,
      volume: vol, turnoverMan: Math.round(vol * close / 10000),
    })
  }
  return out
}

// ─── 주/월/년봉 (일봉 집계) ─────────────────────────────────────────────────────

export type Period = 'W' | 'M' | 'Y'

// yyyyMMdd → 기간 키 (같은 기간이면 같은 문자열)
function periodKey(yyyymmdd: string, period: Period): string {
  const y = yyyymmdd.slice(0, 4)
  const m = yyyymmdd.slice(4, 6)
  const d = yyyymmdd.slice(6, 8)
  if (period === 'Y') return y
  if (period === 'M') return `${y}-${m}`
  // ISO 주차
  const date = new Date(Date.UTC(+y, +m - 1, +d))
  const day = date.getUTCDay() || 7              // 월=1..일=7
  date.setUTCDate(date.getUTCDate() + 4 - day)   // 해당 주 목요일
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1)
  const week = Math.ceil(((date.getTime() - yearStart) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${week}`
}

export function periodSeries(price: number, prevDiff: number, volume: number, period: Period, count: number): DailyBar[] {
  if (count <= 0) return []
  const daysPer = period === 'W' ? 7 : period === 'M' ? 31 : 366
  const neededDays = Math.min(count * daysPer + daysPer, 20000)
  const daily = dailySeries(price, prevDiff, volume, neededDays)

  // 1) 기간별 OHLCV 집계 (daily는 최신→과거)
  const buckets: { close: number; open: number; high: number; low: number; volume: number; date: string }[] = []
  let i = 0
  const n = daily.length
  while (i < n && buckets.length < count) {
    const key = periodKey(daily[i].date, period)
    const newest = daily[i]
    let high = newest.high, low = newest.low, open = newest.open, vol = 0
    const close = newest.close, date = newest.date
    let j = i
    while (j < n && periodKey(daily[j].date, period) === key) {
      const dd = daily[j]
      high = Math.max(high, dd.high)
      low  = Math.min(low, dd.low)
      vol += dd.volume
      open = dd.open               // 가장 과거일 시가로 수렴
      j++
    }
    buckets.push({ close, open, high, low, volume: vol, date })
    i = j
  }

  // 2) 전일대비/등락률 (이전=과거 버킷 종가 대비)
  return buckets.map((b, k) => {
    const prevClose = k + 1 < buckets.length ? buckets[k + 1].close : b.close
    const diff = b.close - prevClose
    const chg  = prevClose === 0 ? 0 : Math.round(diff * 1000 / prevClose) / 10
    return {
      date: b.date, close: b.close, prevDiff: diff, change: chg,
      open: b.open, high: b.high, low: b.low,
      volume: b.volume, turnoverMan: Math.round(b.volume * b.close / 10000),
    }
  })
}
