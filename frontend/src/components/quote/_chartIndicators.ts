// ── 기본 함수 ─────────────────────────────────────────────────────────────────

export function sma(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(null); continue }
    result.push(data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period)
  }
  return result
}

export function ema(data: number[], period: number): (number | null)[] {
  if (data.length < period) return data.map(() => null)
  const k = 2 / (period + 1)
  const result: (number | null)[] = new Array(period - 1).fill(null)
  let prev = data.slice(0, period).reduce((a, b) => a + b, 0) / period
  result.push(prev)
  for (let i = period; i < data.length; i++) {
    prev = data[i] * k + prev * (1 - k)
    result.push(prev)
  }
  return result
}

function wilderSmooth(data: number[], period: number): (number | null)[] {
  if (data.length < period) return data.map(() => null)
  const result: (number | null)[] = new Array(period - 1).fill(null)
  let prev = data.slice(0, period).reduce((a, b) => a + b, 0)
  result.push(prev)
  for (let i = period; i < data.length; i++) {
    prev = prev - prev / period + data[i]
    result.push(prev)
  }
  return result
}

// ── 이동평균선 ─────────────────────────────────────────────────────────────────

export function maLine(closes: number[], period: number) {
  return sma(closes, period)
}

// ── 볼린저 밴드 ────────────────────────────────────────────────────────────────

export function bollingerBands(closes: number[], period = 20, mult = 2) {
  const mids = sma(closes, period)
  return mids.map((mid, i) => {
    if (mid === null) return { upper: null as null, mid: null as null, lower: null as null }
    const slice = closes.slice(i - period + 1, i + 1)
    const dev = Math.sqrt(slice.reduce((s, v) => s + (v - mid) ** 2, 0) / period) * mult
    return { upper: mid + dev, mid, lower: mid - dev }
  })
}

export function bbPercentB(closes: number[], period = 20, mult = 2): (number | null)[] {
  return bollingerBands(closes, period, mult).map(({ upper, lower }, i) => {
    if (upper === null || lower === null) return null
    const range = upper - lower
    return range === 0 ? 0.5 : (closes[i] - lower) / range * 100
  })
}

export function bbWidth(closes: number[], period = 20, mult = 2): (number | null)[] {
  return bollingerBands(closes, period, mult).map(({ upper, lower, mid }) => {
    if (upper === null || lower === null || mid === null || mid === 0) return null
    return (upper - lower) / mid * 100
  })
}

// ── 엔벨로프 ───────────────────────────────────────────────────────────────────

export function envelope(closes: number[], period = 20, pct = 0.06) {
  return sma(closes, period).map(mid => ({
    upper: mid !== null ? mid * (1 + pct) : null as null,
    mid,
    lower: mid !== null ? mid * (1 - pct) : null as null,
  }))
}

// ── RSI ────────────────────────────────────────────────────────────────────────

export function rsiIndicator(closes: number[], period = 14): (number | null)[] {
  if (closes.length < period + 1) return closes.map(() => null)
  const changes = closes.slice(1).map((c, i) => c - closes[i])
  let avgGain = changes.slice(0, period).reduce((a, c) => a + Math.max(0, c), 0) / period
  let avgLoss = changes.slice(0, period).reduce((a, c) => a + Math.max(0, -c), 0) / period
  const result: (number | null)[] = new Array(period).fill(null)
  result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss))
  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + Math.max(0, changes[i])) / period
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -changes[i])) / period
    result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss))
  }
  return result
}

// ── MACD ───────────────────────────────────────────────────────────────────────

export function macdIndicator(closes: number[], fast = 12, slow = 26, signal = 9) {
  const fastE = ema(closes, fast)
  const slowE = ema(closes, slow)
  const macdLine = closes.map((_, i) => {
    const f = fastE[i]; const s = slowE[i]
    return f !== null && s !== null ? f - s : null
  })
  const firstValid = macdLine.findIndex(v => v !== null)
  const validMacd = macdLine.slice(firstValid) as number[]
  const signalE = ema(validMacd, signal)
  const signalLine = macdLine.map((_, i) => {
    if (i < firstValid) return null
    return signalE[i - firstValid] ?? null
  })
  const histogram = macdLine.map((m, i) => {
    const s = signalLine[i]
    return m !== null && s !== null ? m - s : null
  })
  return { macdLine, signalLine, histogram }
}

// ── 스토캐스틱 ────────────────────────────────────────────────────────────────

export function stochastic(
  highs: number[], lows: number[], closes: number[], k = 14, smooth = 3
) {
  const rawK: (number | null)[] = closes.map((c, i) => {
    if (i < k - 1) return null
    const hh = Math.max(...highs.slice(i - k + 1, i + 1))
    const ll = Math.min(...lows.slice(i - k + 1, i + 1))
    return hh === ll ? 50 : 100 * (c - ll) / (hh - ll)
  })
  const kLine = sma(rawK.map(v => v ?? 0), smooth).map((v, i) =>
    rawK[i] === null ? null : v
  )
  const dLine = sma(kLine.map(v => v ?? 0), 3).map((v, i) =>
    kLine[i] === null ? null : v
  )
  return { kLine, dLine }
}

export function stochasticRsi(closes: number[], rsiPeriod = 14, stochPeriod = 14, smooth = 3) {
  const rsi = rsiIndicator(closes, rsiPeriod).map(v => v ?? 50)
  return stochastic(rsi, rsi, rsi, stochPeriod, smooth)
}

// ── ADX / DMI ─────────────────────────────────────────────────────────────────

export function adxDmi(highs: number[], lows: number[], closes: number[], period = 14) {
  const plusDM: number[] = [0]
  const minusDM: number[] = [0]
  const tr: number[] = [highs[0] - lows[0]]
  for (let i = 1; i < closes.length; i++) {
    const upMove = highs[i] - highs[i - 1]
    const downMove = lows[i - 1] - lows[i]
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0)
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0)
    tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])))
  }
  const sTR   = wilderSmooth(tr, period)
  const sPDM  = wilderSmooth(plusDM, period)
  const sMDM  = wilderSmooth(minusDM, period)
  const plusDI  = sTR.map((t, i) => t !== null && t > 0 ? 100 * (sPDM[i] ?? 0) / t : null)
  const minusDI = sTR.map((t, i) => t !== null && t > 0 ? 100 * (sMDM[i] ?? 0) / t : null)
  const dx = plusDI.map((p, i) => {
    const m = minusDI[i]
    if (p === null || m === null) return 0
    const sum = p + m
    return sum === 0 ? 0 : Math.abs(p - m) / sum * 100
  })
  const adx = wilderSmooth(dx, period)
  return { adx, plusDI, minusDI }
}

// ── CCI ────────────────────────────────────────────────────────────────────────

export function cciIndicator(highs: number[], lows: number[], closes: number[], period = 20): (number | null)[] {
  const tp = closes.map((c, i) => (highs[i] + lows[i] + c) / 3)
  return tp.map((t, i) => {
    if (i < period - 1) return null
    const slice = tp.slice(i - period + 1, i + 1)
    const mean = slice.reduce((a, b) => a + b, 0) / period
    const md = slice.reduce((s, v) => s + Math.abs(v - mean), 0) / period
    return md === 0 ? 0 : (t - mean) / (0.015 * md)
  })
}

// ── OBV ────────────────────────────────────────────────────────────────────────

export function obvIndicator(closes: number[], volumes: number[]): number[] {
  const result: number[] = [0]
  for (let i = 1; i < closes.length; i++) {
    const prev = result[i - 1]
    result.push(closes[i] > closes[i - 1] ? prev + volumes[i] : closes[i] < closes[i - 1] ? prev - volumes[i] : prev)
  }
  return result
}

// ── ROC ────────────────────────────────────────────────────────────────────────

export function rocIndicator(closes: number[], period = 12): (number | null)[] {
  return closes.map((c, i) => {
    if (i < period) return null
    const prev = closes[i - period]
    return prev === 0 ? null : (c - prev) / prev * 100
  })
}

// ── 파라볼릭 SAR ──────────────────────────────────────────────────────────────

export function parabolicSar(highs: number[], lows: number[], step = 0.02, max = 0.2): (number | null)[] {
  if (highs.length < 2) return highs.map(() => null)
  const result: (number | null)[] = [null]
  let isLong = true
  let sar = lows[0]
  let ep = highs[0]
  let af = step
  for (let i = 1; i < highs.length; i++) {
    sar = sar + af * (ep - sar)
    if (isLong) {
      sar = Math.min(sar, lows[i - 1], i > 1 ? lows[i - 2] : lows[i - 1])
      if (lows[i] < sar) { isLong = false; sar = ep; ep = lows[i]; af = step }
      else if (highs[i] > ep) { ep = highs[i]; af = Math.min(af + step, max) }
    } else {
      sar = Math.max(sar, highs[i - 1], i > 1 ? highs[i - 2] : highs[i - 1])
      if (highs[i] > sar) { isLong = true; sar = ep; ep = highs[i]; af = step }
      else if (lows[i] < ep) { ep = lows[i]; af = Math.min(af + step, max) }
    }
    result.push(sar)
  }
  return result
}

// ── VWAP ───────────────────────────────────────────────────────────────────────

export function vwapIndicator(highs: number[], lows: number[], closes: number[], volumes: number[]): number[] {
  let cumVol = 0; let cumTP = 0
  return closes.map((c, i) => {
    const tp = (highs[i] + lows[i] + c) / 3
    cumTP += tp * volumes[i]; cumVol += volumes[i]
    return cumVol === 0 ? tp : cumTP / cumVol
  })
}

// ── 일목균형표 ────────────────────────────────────────────────────────────────

export function ichimoku(highs: number[], lows: number[], closes: number[], tenkan = 9, kijun = 26, senkou = 52) {
  const mid = (period: number, i: number) => {
    if (i < period - 1) return null
    const h = highs.slice(i - period + 1, i + 1)
    const l = lows.slice(i - period + 1, i + 1)
    return (Math.max(...h) + Math.min(...l)) / 2
  }
  const tenkanSen = highs.map((_, i) => mid(tenkan, i))
  const kijunSen  = highs.map((_, i) => mid(kijun, i))
  const senkouA   = tenkanSen.map((t, i) => {
    const k = kijunSen[i]; return t !== null && k !== null ? (t + k) / 2 : null
  })
  const senkouB   = highs.map((_, i) => mid(senkou, i))
  const chikou    = closes.map((c, i) => (i + kijun < closes.length ? closes[i + kijun] : null))
  return { tenkanSen, kijunSen, senkouA, senkouB, chikou }
}
