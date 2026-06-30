// 일자별(일봉) 합성 시세 생성기 — 일별 그리드 · 차트 일봉(D) · 투자동향이 공유.
// 백엔드 com.innotrader.common.support.MockDailySeries 와 동일한 로직(미러링).
//
// - 오늘(0) 종가 = 현재가(price), 어제(1) 종가 = 전일종가(price - prevDiff)로 앵커
// - 각 인덱스 값은 인덱스에만 의존하므로 count가 달라도 겹치는 날짜는 동일

const lcg = (seed: number) => {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff }
}

/** KRX 가격대별 호가 단위 (백엔드 PriceTick 미러). */
export function tickSize(price: number): number {
  if (price < 2_000)   return 1
  if (price < 5_000)   return 5
  if (price < 20_000)  return 10
  if (price < 50_000)  return 50
  if (price < 200_000) return 100
  if (price < 500_000) return 500
  return 1_000
}

/** 가격을 호가 단위 그리드로 반올림. */
export function roundTick(price: number): number {
  const t = tickSize(price)
  return Math.max(t, Math.round(price / t) * t)
}

/**
 * 봉 내 가격 경로(시가→종가 서브 브리지)의 극값으로 고가/저가 산출.
 * 임의 wick 가산 없이 경로가 실제 도달한 최대/최소만 사용 (백엔드 pathExtremes 미러).
 * high ≥ max(open,close), low ≤ min(open,close).
 */
export function pathExtremes(open: number, close: number, amp: number, r: () => number, sub: number): [number, number] {
  let hi = Math.max(open, close), lo = Math.min(open, close)
  const w = new Array<number>(sub + 1); w[0] = 0
  for (let s = 1; s <= sub; s++) w[s] = w[s - 1] + (r() - 0.5)
  for (let s = 1; s < sub; s++) {
    const bridge = w[s] - w[sub] * (s / sub)
    const v = Math.round(open + (close - open) * s / sub + bridge * amp)
    hi = Math.max(hi, v); lo = Math.min(lo, v)
  }
  return [hi, Math.max(100, lo)]
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
  closes[0] = roundTick(price)
  closes[1] = Math.max(100, roundTick(price - prevDiff))
  for (let i = 2; i <= count; i++) {
    const dc = (rc() - 0.5) * 0.04
    closes[i] = Math.max(100, roundTick(Math.round(closes[i - 1] * (1 + dc))))
  }

  // 바 속성 (별도 단일 스트림): 시가/고가/저가/거래량
  const rb = lcg(price * 59 + 7)
  const today = new Date()
  const out: DailyBar[] = []
  for (let i = 0; i < count; i++) {
    const close     = closes[i]
    const prevClose = closes[i + 1]
    const open = Math.max(100, roundTick(Math.round(prevClose * (1 + (rb() - 0.5) * 0.01))))
    // 고가/저가 = 당일 가격 경로의 극값 (종가가 실제 도달한 값만, 호가 단위 정렬)
    const [hiPath, loPath] = pathExtremes(open, close, Math.max(1, Math.round(close * 0.006)), rb, 8)
    const high = roundTick(hiPath)
    const low  = roundTick(loPath)
    const vol  = Math.max(1000, Math.round(volume * (0.5 + rb())))
    const diff = close - prevClose
    const chg  = prevClose === 0 ? 0 : Math.round(diff * 1000 / prevClose) / 10
    const d = new Date(today); d.setDate(d.getDate() - i)
    // 로컬(KST) 기준 yyyyMMdd — toISOString()은 UTC라 자정~오전 사이 날짜가 하루 밀려
    // WS(KST) 날짜와 어긋나므로 사용하지 않는다.
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    out.push({
      date: ymd,
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
