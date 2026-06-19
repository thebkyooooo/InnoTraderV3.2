// 장중(분봉/체결) 합성 시세 생성기 — 백엔드 com.innotrader.common.support.MockIntradaySeries 미러링.
//
// 각 거래일의 분봉/체결은 그 날 일봉(시가→종가)을 잇는 브라우니안 브리지로 생성되어 일봉과
// 일관되며, 가장 최근 값(분봉 최신 봉 종가·최근 체결가)은 현재가(price)에 앵커된다.
// 반환 index 0 = 가장 최근.

import { dailySeries } from './_dailySeries'

const lcg = (seed: number) => {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff }
}

export interface IntraBar {
  time: string         // HHmmss
  close: number
  prevDiff: number
  change: number
  open: number
  high: number
  low: number
  filledVolume: number
  volume: number       // 누적
}

export interface Tick {
  time: string         // HHmmss
  price: number
  prevDiff: number
  change: number
  askPrice: number
  bidPrice: number
  filledVolume: number
  fillStrength: number
  volume: number       // 누적
}

// ─── 분봉 ───────────────────────────────────────────────────────────────────────

export function minuteCandles(price: number, prevDiff: number, volume: number,
                              intervalMinutes: number, count: number): IntraBar[] {
  if (count <= 0) return []
  const candlesPerDay = Math.max(1, Math.floor(390 / intervalMinutes))
  const daysNeeded = Math.floor(count / candlesPerDay) + 2
  const daily = dailySeries(price, prevDiff, volume, daysNeeded)

  const r = lcg(price * 83 + intervalMinutes)
  const out: IntraBar[] = []

  for (let d = 0; d < daily.length && out.length < count; d++) {
    const db = daily[d]
    const dayOpen = db.open, dayClose = db.close
    const prevDayClose = db.close - db.prevDiff
    const amp = Math.max(1, Math.round(dayClose * 0.0006))
    const K = candlesPerDay

    // 브라우니안 브리지: p[0]=시가, p[K]=종가
    const w = new Array<number>(K + 1); w[0] = 0
    for (let k = 1; k <= K; k++) w[k] = w[k - 1] + (r() - 0.5)
    const p = new Array<number>(K + 1)
    for (let k = 0; k <= K; k++) {
      const bridge = w[k] - w[K] * (k / K)
      const lin = dayOpen + (dayClose - dayOpen) * (k / K)
      p[k] = Math.max(100, Math.round(lin + bridge * amp))
    }
    p[0] = dayOpen; p[K] = dayClose

    // 누적 거래량 (chronological)
    const fvol = new Array<number>(K)
    const cumPerC = new Array<number>(K)
    let cum = 0
    for (let c = 0; c < K; c++) {
      const fv = Math.max(1, Math.round(volume / K * (0.5 + r())))
      fvol[c] = fv; cum += fv; cumPerC[c] = cum
    }

    // 최신(c=K-1)부터 출력. d=0,c=K-1 → 종가 = price(현재가)
    for (let c = K - 1; c >= 0 && out.length < count; c--) {
      const open = p[c], close = p[c + 1]
      const noise = Math.max(1, Math.round(dayClose * 0.0004 * r()))
      const high = Math.max(open, close) + noise
      const low  = Math.max(100, Math.min(open, close) - noise)
      const minFromOpen = c * intervalMinutes
      const h = 9 + Math.floor(minFromOpen / 60), m = minFromOpen % 60
      const time = `${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`
      const diff = close - prevDayClose
      const chg = prevDayClose === 0 ? 0 : Math.round(diff * 1000 / prevDayClose) / 10
      out.push({ time, close, prevDiff: diff, change: chg, open, high, low, filledVolume: fvol[c], volume: cumPerC[c] })
    }
  }
  return out
}

// ─── 체결 ───────────────────────────────────────────────────────────────────────

export function filledTicks(price: number, prevDiff: number, volume: number,
                            totalMinutes: number, count: number, tickUnit: number): Tick[] {
  if (count <= 0) return []
  const dayOpen = dailySeries(price, prevDiff, volume, 1)[0].open
  const prevDayClose = price - prevDiff
  const r = lcg(price * 37)

  const T = count
  const amp = Math.max(1, Math.round(price * 0.0006))
  const w = new Array<number>(T); w[0] = 0
  for (let k = 1; k < T; k++) w[k] = w[k - 1] + (r() - 0.5)

  // 가격: 시가 → 현재가 브리지. 마지막 틱 = 현재가
  const pr = new Array<number>(T)
  for (let k = 0; k < T; k++) {
    const frac = T > 1 ? k / (T - 1) : 1
    const bridge = w[k] - (T > 1 ? w[T - 1] * frac : 0)
    const lin = dayOpen + (price - dayOpen) * frac
    pr[k] = Math.max(100, Math.round(lin + bridge * amp))
  }
  pr[0] = dayOpen; pr[T - 1] = price

  // chronological → 최신부터 (reverse)
  const chron: Tick[] = []
  let cum = 0
  for (let k = 0; k < T; k++) {
    const price_k = pr[k]
    const fv = Math.max(1, Math.round(r() * 1000))
    cum += fv
    const strength = Math.max(0, Math.min(200, 50 + (r() - 0.5) * 60))
    const minuteOffset = T > 1 ? Math.floor(k * totalMinutes / (T - 1)) : 0
    const second = Math.floor(r() * 60)
    const mm = 9 * 60 + minuteOffset
    const time = `${String(Math.floor(mm / 60)).padStart(2, '0')}${String(mm % 60).padStart(2, '0')}${String(second).padStart(2, '0')}`
    const diff = price_k - prevDayClose
    const chg = Math.round(diff * 1000 / (prevDayClose + 1)) / 10
    chron.push({ time, price: price_k, prevDiff: diff, change: chg,
                 askPrice: price_k + tickUnit, bidPrice: price_k - tickUnit,
                 filledVolume: fv, fillStrength: strength, volume: cum })
  }
  chron.reverse()
  return chron
}
