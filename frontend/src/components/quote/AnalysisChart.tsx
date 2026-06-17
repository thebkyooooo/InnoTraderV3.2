'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  createChart, ColorType, IChartApi, ISeriesApi, SeriesType, Time,
  CandlestickSeries, LineSeries, AreaSeries, HistogramSeries, BarSeries,
  type LogicalRange,
} from 'lightweight-charts'
import { quoteApi, type DailyChartType } from '@/features/quote/api/quote-api'
import * as ind from './_chartIndicators'

// ── Types ─────────────────────────────────────────────────────────────────────

type ChartMode = 'minute' | 'daily'
type MinPeriod = 1 | 5 | 10 | 30 | 60
type ChartType = 'candlestick' | 'bar' | 'line' | 'area'
interface Bar { time: Time; open: number; high: number; low: number; close: number; volume: number }

// ── Constants ─────────────────────────────────────────────────────────────────

const UP = '#ef5350', DOWN = '#4285f4'

const OVERLAYS = [
  { id: 'ma5',         label: 'MA5',         color: '#ff6b6b' },
  { id: 'ma10',        label: 'MA10',        color: '#ffd93d' },
  { id: 'ma20',        label: 'MA20',        color: '#6bcb77' },
  { id: 'ma60',        label: 'MA60',        color: '#4d96ff' },
  { id: 'ma120',       label: 'MA120',       color: '#c77dff' },
  { id: 'bollinger',   label: '볼린저 밴드',  color: '#9c27b0' },
  { id: 'ichimoku',    label: '일목균형표',   color: '#00bcd4' },
  { id: 'envelope',    label: '엔벨로프',     color: '#607d8b' },
  { id: 'parabolicSar',label: '파라볼릭 SAR', color: '#ff9800' },
  { id: 'vwap',        label: 'VWAP',        color: '#e91e63' },
]

const SUBS = [
  { id: 'volume',        label: '거래량' },
  { id: 'macd',          label: 'MACD' },
  { id: 'rsi',           label: 'RSI' },
  { id: 'stochastic',    label: '스토캐스틱' },
  { id: 'stochasticRsi', label: '스토캐스틱 RSI' },
  { id: 'adx',           label: 'ADX' },
  { id: 'cci',           label: 'CCI' },
  { id: 'dmi',           label: 'DMI' },
  { id: 'bbPercentB',    label: 'BB %B' },
  { id: 'bbWidth',       label: 'BB 밴드폭' },
  { id: 'obv',           label: 'OBV' },
  { id: 'roc',           label: 'ROC' },
]

// 일봉 유형별 조회 개수(fetch) / 초기 표시 개수(view)
const DAILY_FETCH: Record<DailyChartType, number> = { D: 360, W: 360, M: 72, Y: 47 }
const DAILY_VIEW:  Record<DailyChartType, number> = { D: 120, W: 120, M: 36, Y: 47 }
// 분봉 조회 개수(120*3) / 초기 표시 개수
const MIN_VIEW  = 120
const MIN_FETCH = MIN_VIEW * 3

// ── Helpers ───────────────────────────────────────────────────────────────────

function toLineData(bars: Bar[], values: (number | null)[]) {
  return bars
    .map((b, i) => ({ time: b.time, value: values[i] }))
    .filter((d): d is { time: Time; value: number } => d.value !== null)
}

function mkLine(chart: IChartApi, color: string, pane: number, width: 1 | 2 | 3 | 4 = 1) {
  return chart.addSeries(LineSeries, { color, lineWidth: width, lastValueVisible: false, priceLineVisible: false }, pane)
}

function mkHist(chart: IChartApi, pane: number) {
  return chart.addSeries(HistogramSeries, { lastValueVisible: false, priceLineVisible: false }, pane)
}

// crosshair x축 라벨: 일봉="26.06.16", 분봉="26.06.16 01:26"
function fmtCrosshairTime(time: Time): string {
  const p2 = (n: number) => String(n).padStart(2, '0')

  if (typeof time === 'string') {                 // "2026-06-16"
    const [y, m, d] = time.split('-')
    return `${y.slice(2)}.${m}.${d}`
  }
  if (typeof time === 'number') {                 // UNIX 타임스탬프(초)
    const dt = new Date(time * 1000)
    return `${p2(dt.getUTCFullYear() % 100)}.${p2(dt.getUTCMonth() + 1)}.${p2(dt.getUTCDate())} `
      + `${p2(dt.getUTCHours())}:${p2(dt.getUTCMinutes())}`
  }
  // BusinessDay { year, month, day }
  return `${p2(time.year % 100)}.${p2(time.month)}.${p2(time.day)}`
}

// ── Chart Builder ─────────────────────────────────────────────────────────────

function buildChart(
  container: HTMLElement,
  bars: Bar[],
  chartType: ChartType,
  activeOverlays: Set<string>,
  activeSubs: Set<string>,
): IChartApi {
  const isDark = document.documentElement.classList.contains('dark')

  const chart = createChart(container, {
    autoSize: true,
    layout: {
      background: { type: ColorType.Solid, color: isDark ? '#1e1e2e' : '#ffffff' },
      textColor: isDark ? '#cdd6f4' : '#333',
    },
    grid: {
      vertLines: { color: isDark ? '#313244' : '#f0f0f0' },
      horzLines: { color: isDark ? '#313244' : '#f0f0f0' },
    },
    timeScale: { timeVisible: true, secondsVisible: false },
    localization: { timeFormatter: fmtCrosshairTime },
    crosshair: { mode: 1 },
  })

  const closes  = bars.map(b => b.close)
  const highs   = bars.map(b => b.high)
  const lows    = bars.map(b => b.low)
  const volumes = bars.map(b => b.volume)

  // ── 가격 시리즈 (pane 0) ──────────────────────────────────────────────────

  const priceScale = { scaleMargins: { top: 0.08, bottom: 0.04 } }

  if (chartType === 'candlestick') {
    const s = chart.addSeries(CandlestickSeries, {
      upColor: UP, downColor: DOWN, borderVisible: false, wickUpColor: UP, wickDownColor: DOWN,
    }, 0)
    s.setData(bars.map(b => ({ time: b.time, open: b.open, high: b.high, low: b.low, close: b.close })))
    s.priceScale().applyOptions(priceScale)
  } else if (chartType === 'bar') {
    const s = chart.addSeries(BarSeries, { upColor: UP, downColor: DOWN }, 0)
    s.setData(bars.map(b => ({ time: b.time, open: b.open, high: b.high, low: b.low, close: b.close })))
    s.priceScale().applyOptions(priceScale)
  } else if (chartType === 'line') {
    const s = chart.addSeries(LineSeries, { color: UP, lineWidth: 2 }, 0)
    s.setData(bars.map(b => ({ time: b.time, value: b.close })))
    s.priceScale().applyOptions(priceScale)
  } else {
    const s = chart.addSeries(AreaSeries, { lineColor: UP, topColor: 'rgba(239,83,80,0.25)', bottomColor: 'rgba(239,83,80,0)' }, 0)
    s.setData(bars.map(b => ({ time: b.time, value: b.close })))
    s.priceScale().applyOptions(priceScale)
  }

  // ── 오버레이 지표 (pane 0) ────────────────────────────────────────────────

  for (const { id, color } of OVERLAYS) {
    if (!activeOverlays.has(id)) continue
    const c = color ?? '#999'

    if (id.startsWith('ma')) {
      const p = parseInt(id.replace('ma', ''))
      const s = mkLine(chart, c, 0)
      s.setData(toLineData(bars, ind.maLine(closes, p)))

    } else if (id === 'bollinger') {
      const bb = ind.bollingerBands(closes)
      mkLine(chart, '#7b1fa2', 0).setData(toLineData(bars, bb.map(v => v.upper)))
      mkLine(chart, '#9c27b0', 0).setData(toLineData(bars, bb.map(v => v.mid)))
      mkLine(chart, '#7b1fa2', 0).setData(toLineData(bars, bb.map(v => v.lower)))

    } else if (id === 'ichimoku') {
      const ichi = ind.ichimoku(highs, lows, closes)
      mkLine(chart, '#e53935', 0).setData(toLineData(bars, ichi.tenkanSen))
      mkLine(chart, '#1e88e5', 0).setData(toLineData(bars, ichi.kijunSen))
      mkLine(chart, '#43a047', 0).setData(toLineData(bars, ichi.senkouA))
      mkLine(chart, '#fb8c00', 0).setData(toLineData(bars, ichi.senkouB))
      mkLine(chart, '#8e24aa', 0, 1).setData(toLineData(bars, ichi.chikou))

    } else if (id === 'envelope') {
      const env = ind.envelope(closes)
      mkLine(chart, '#607d8b', 0).setData(toLineData(bars, env.map(v => v.upper)))
      mkLine(chart, '#90a4ae', 0).setData(toLineData(bars, env.map(v => v.mid)))
      mkLine(chart, '#607d8b', 0).setData(toLineData(bars, env.map(v => v.lower)))

    } else if (id === 'parabolicSar') {
      const s = mkLine(chart, c, 0)
      s.setData(toLineData(bars, ind.parabolicSar(highs, lows)))

    } else if (id === 'vwap') {
      const s = mkLine(chart, c, 0, 2)
      s.setData(bars.map((b, i) => ({ time: b.time, value: ind.vwapIndicator(highs, lows, closes, volumes)[i] })))
    }
  }

  // ── 보조 지표 (pane 1+) ───────────────────────────────────────────────────

  const subList = SUBS.filter(s => activeSubs.has(s.id))
  subList.forEach(({ id }, idx) => {
    const pane = idx + 1

    if (id === 'volume') {
      const s = mkHist(chart, pane)
      s.setData(bars.map(b => ({
        time: b.time, value: b.volume,
        color: b.close >= b.open ? 'rgba(239,83,80,0.6)' : 'rgba(66,133,244,0.6)',
      })))

    } else if (id === 'macd') {
      const { macdLine, signalLine, histogram } = ind.macdIndicator(closes)
      mkHist(chart, pane).setData(
        bars.map((b, i) => ({ time: b.time, value: histogram[i] ?? 0,
          color: (histogram[i] ?? 0) >= 0 ? 'rgba(239,83,80,0.7)' : 'rgba(66,133,244,0.7)' }))
          .filter((_, i) => histogram[i] !== null)
      )
      mkLine(chart, '#2962ff', pane, 2).setData(toLineData(bars, macdLine))
      mkLine(chart, '#ff6d00', pane, 1).setData(toLineData(bars, signalLine))

    } else if (id === 'rsi') {
      const s = mkLine(chart, '#7b1fa2', pane, 2)
      s.setData(toLineData(bars, ind.rsiIndicator(closes)))
      // 과매수/과매도 레벨
      mkLine(chart, 'rgba(239,83,80,0.4)', pane).setData(bars.map(b => ({ time: b.time, value: 70 })))
      mkLine(chart, 'rgba(66,133,244,0.4)', pane).setData(bars.map(b => ({ time: b.time, value: 30 })))

    } else if (id === 'stochastic') {
      const { kLine, dLine } = ind.stochastic(highs, lows, closes)
      mkLine(chart, '#2196f3', pane, 2).setData(toLineData(bars, kLine))
      mkLine(chart, '#ff5722', pane, 1).setData(toLineData(bars, dLine))
      mkLine(chart, 'rgba(239,83,80,0.3)', pane).setData(bars.map(b => ({ time: b.time, value: 80 })))
      mkLine(chart, 'rgba(66,133,244,0.3)', pane).setData(bars.map(b => ({ time: b.time, value: 20 })))

    } else if (id === 'stochasticRsi') {
      const { kLine, dLine } = ind.stochasticRsi(closes)
      mkLine(chart, '#2196f3', pane, 2).setData(toLineData(bars, kLine))
      mkLine(chart, '#ff5722', pane, 1).setData(toLineData(bars, dLine))

    } else if (id === 'adx') {
      const { adx } = ind.adxDmi(highs, lows, closes)
      mkLine(chart, '#ff6900', pane, 2).setData(toLineData(bars, adx))

    } else if (id === 'cci') {
      const s = mkLine(chart, '#009688', pane, 2)
      s.setData(toLineData(bars, ind.cciIndicator(highs, lows, closes)))
      mkLine(chart, 'rgba(239,83,80,0.3)', pane).setData(bars.map(b => ({ time: b.time, value: 100 })))
      mkLine(chart, 'rgba(66,133,244,0.3)', pane).setData(bars.map(b => ({ time: b.time, value: -100 })))

    } else if (id === 'dmi') {
      const { plusDI, minusDI } = ind.adxDmi(highs, lows, closes)
      mkLine(chart, UP,   pane, 2).setData(toLineData(bars, plusDI))
      mkLine(chart, DOWN, pane, 2).setData(toLineData(bars, minusDI))

    } else if (id === 'bbPercentB') {
      mkLine(chart, '#9c27b0', pane, 2).setData(toLineData(bars, ind.bbPercentB(closes)))
      mkLine(chart, 'rgba(0,0,0,0.15)', pane).setData(bars.map(b => ({ time: b.time, value: 100 })))
      mkLine(chart, 'rgba(0,0,0,0.15)', pane).setData(bars.map(b => ({ time: b.time, value: 0 })))

    } else if (id === 'bbWidth') {
      mkLine(chart, '#795548', pane, 2).setData(toLineData(bars, ind.bbWidth(closes)))

    } else if (id === 'obv') {
      mkLine(chart, '#00897b', pane, 2).setData(
        bars.map((b, i) => ({ time: b.time, value: ind.obvIndicator(closes, volumes)[i] }))
      )

    } else if (id === 'roc') {
      mkLine(chart, '#f57c00', pane, 2).setData(toLineData(bars, ind.rocIndicator(closes)))
      mkLine(chart, 'rgba(0,0,0,0.15)', pane).setData(bars.map(b => ({ time: b.time, value: 0 })))
    }
  })

  return chart
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────

export interface AnalysisChartProps { symbol: string }

export function AnalysisChart({ symbol }: AnalysisChartProps) {
  const [mode, setMode]         = useState<ChartMode>('daily')
  const [minPeriod, setMinPeriod] = useState<MinPeriod>(5)
  const [dailyType, setDailyType] = useState<DailyChartType>('D')
  const [chartType, setChartType] = useState<ChartType>('candlestick')
  const [overlays, setOverlays]   = useState<Set<string>>(new Set(['ma5', 'ma20']))
  const [subs, setSubs]           = useState<Set<string>>(new Set(['volume']))
  const [bars, setBars]           = useState<Bar[]>([])
  const [loading, setLoading]     = useState(false)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [subOpen, setSubOpen]         = useState(false)

  const containerRef        = useRef<HTMLDivElement>(null)
  const chartRef            = useRef<IChartApi | null>(null)
  const hasMoreRef          = useRef(false)
  const loadingRef          = useRef(false)
  const cursorRef           = useRef<string | null>(null)
  const earliestTsRef       = useRef(0)
  const loadMoreFnRef       = useRef<(() => void) | null>(null)
  const savedRangeRef        = useRef<{ from: Time; to: Time } | null>(null)
  const armedRef             = useRef(true)
  const resetPendingRef      = useRef(false)
  const viewCountRef         = useRef(MIN_VIEW)
  const overlayRef          = useRef<HTMLDivElement>(null)
  const subRef              = useRef<HTMLDivElement>(null)

  // ── 데이터 로드 ────────────────────────────────────────────────────────────

  const loadData = useCallback(async (reset: boolean) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    if (reset) {
      cursorRef.current = null
      savedRangeRef.current = null
      resetPendingRef.current = true
      viewCountRef.current = mode === 'daily' ? DAILY_VIEW[dailyType] : MIN_VIEW
    }

    try {
      const cursor = cursorRef.current ?? undefined

      if (mode === 'daily') {
        const res  = await quoteApi.getChartDaily(symbol, dailyType, DAILY_FETCH[dailyType], cursor)
        const page = res.data
        const converted: Bar[] = page.items.slice().reverse().map(item => {
          const d = item.date
          return {
            time: `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}` as Time,
            open: item.open, high: item.high, low: item.low, close: item.price, volume: item.volume,
          }
        })
        setBars(prev => reset ? converted : [...converted, ...prev])
        cursorRef.current  = page.nextCursor
        hasMoreRef.current = page.hasNext
      } else {
        const res  = await quoteApi.getChartTime(symbol, minPeriod, MIN_FETCH, cursor)
        const page = res.data
        const periodSec = minPeriod * 60
        const reversed  = page.items.slice().reverse()

        let converted: Bar[]
        if (reset) {
          const now = Math.floor(Date.now() / 1000)
          converted = reversed.map((item, i) => ({
            time: (now - (reversed.length - 1 - i) * periodSec) as Time,
            open: item.open, high: item.high, low: item.low, close: item.price, volume: item.filledVolume,
          }))
          if (converted.length > 0) earliestTsRef.current = converted[0].time as number
        } else {
          const earliest = earliestTsRef.current
          converted = reversed.map((item, i) => ({
            time: (earliest - (reversed.length - i) * periodSec) as Time,
            open: item.open, high: item.high, low: item.low, close: item.price, volume: item.filledVolume,
          }))
          if (converted.length > 0) earliestTsRef.current = converted[0].time as number
        }
        setBars(prev => reset ? converted : [...converted, ...prev])
        cursorRef.current  = page.nextCursor
        hasMoreRef.current = page.hasNext
      }
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [symbol, mode, dailyType, minPeriod])

  // 파라미터 변경 시 리셋 로드
  useEffect(() => {
    setBars([])
    loadData(true)
  }, [loadData])

  // loadMore 함수 참조 갱신
  useEffect(() => {
    loadMoreFnRef.current = () => {
      if (!hasMoreRef.current || loadingRef.current) return
      loadData(false)
    }
  }, [loadData])

  // ── 차트 렌더링 ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current || bars.length === 0) return

    const savedRange = savedRangeRef.current

    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null }

    const chart = buildChart(containerRef.current, bars, chartType, overlays, subs)
    chartRef.current = chart

    const rangeHandler = (range: LogicalRange | null) => {
      if (range === null) return
      if (range.from > 10) armedRef.current = true          // 끝에서 충분히 벗어남 → 재무장
      if (range.from < -1 && armedRef.current) {             // 왼쪽 끝 진입 순간 1회만 발화
        armedRef.current = false
        loadMoreFnRef.current?.()
      }
    }
    chart.timeScale().subscribeVisibleLogicalRangeChange(rangeHandler)

    if (savedRange) {
      chart.timeScale().setVisibleRange(savedRange)
    } else {
      const view = viewCountRef.current
      const n = bars.length
      if (view > 0 && n > view) {
        chart.timeScale().setVisibleLogicalRange({ from: n - view, to: n - 1 })
      } else {
        chart.timeScale().fitContent()
      }
    }

    return () => {
      if (!resetPendingRef.current) savedRangeRef.current = chart.timeScale().getVisibleRange()
      resetPendingRef.current = false
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(rangeHandler)
      chart.remove()
      chartRef.current = null
    }
  }, [bars, chartType, overlays, subs])

  // ── 드롭다운 외부 클릭 닫기 ────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!overlayRef.current?.contains(e.target as Node)) setOverlayOpen(false)
      if (!subRef.current?.contains(e.target as Node)) setSubOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── 토글 헬퍼 ─────────────────────────────────────────────────────────────

  const toggleOverlay = (id: string) =>
    setOverlays(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const toggleSub = (id: string) =>
    setSubs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  // ── UI ─────────────────────────────────────────────────────────────────────

  const btnBase = 'px-2 py-1 text-xs rounded transition-colors'
  const btnActive = 'bg-blue-600 text-white'
  const btnInactive = 'bg-gray-100 text-gray-600 hover:bg-gray-200'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-gray-200 bg-white shrink-0 text-xs">

        {/* 조회 모드 */}
        <div className="flex gap-0.5 rounded border border-gray-200 overflow-hidden">
          {(['minute', 'daily'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-2.5 py-1 ${mode === m ? btnActive : btnInactive} rounded-none`}>
              {m === 'minute' ? '분봉' : '일봉'}
            </button>
          ))}
        </div>

        {/* 분봉 서브 */}
        {mode === 'minute' && (
          <div className="flex gap-0.5">
            {([1,5,10,30,60] as MinPeriod[]).map(p => (
              <button key={p} onClick={() => setMinPeriod(p)}
                className={`${btnBase} ${minPeriod === p ? btnActive : btnInactive}`}>
                {p}분
              </button>
            ))}
          </div>
        )}

        {/* 일봉 서브 */}
        {mode === 'daily' && (
          <div className="flex gap-0.5">
            {(['D','W','M','Y'] as DailyChartType[]).map(t => (
              <button key={t} onClick={() => setDailyType(t)}
                className={`${btnBase} ${dailyType === t ? btnActive : btnInactive}`}>
                {t === 'D' ? '일' : t === 'W' ? '주' : t === 'M' ? '월' : '년'}
              </button>
            ))}
          </div>
        )}

        <div className="w-px h-4 bg-gray-200 mx-0.5" />

        {/* 차트 유형 */}
        <div className="flex gap-0.5">
          {([
            ['candlestick','캔들'],['bar','바'],['line','라인'],['area','영역']
          ] as [ChartType,string][]).map(([t, label]) => (
            <button key={t} onClick={() => setChartType(t)}
              className={`${btnBase} ${chartType === t ? btnActive : btnInactive}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-gray-200 mx-0.5" />

        {/* 오버레이 드롭다운 */}
        <div ref={overlayRef} className="relative">
          <button onClick={() => setOverlayOpen(v => !v)}
            className={`${btnBase} border ${overlayOpen ? 'border-blue-400 text-blue-600' : 'border-gray-200 text-gray-600'} bg-white hover:bg-gray-50`}>
            오버레이{overlays.size > 0 ? ` (${overlays.size})` : ''}
          </button>
          {overlayOpen && (
            <div className="absolute top-full left-0 z-20 mt-0.5 bg-white border border-gray-200 rounded shadow-lg min-w-[150px] py-1">
              {OVERLAYS.map(({ id, label, color }) => (
                <label key={id} className="flex items-center gap-2 px-3 py-1 hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={overlays.has(id)} onChange={() => toggleOverlay(id)}
                    className="w-3 h-3 accent-blue-600" />
                  {color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />}
                  <span className="text-xs text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 보조지표 드롭다운 */}
        <div ref={subRef} className="relative">
          <button onClick={() => setSubOpen(v => !v)}
            className={`${btnBase} border ${subOpen ? 'border-blue-400 text-blue-600' : 'border-gray-200 text-gray-600'} bg-white hover:bg-gray-50`}>
            보조지표{subs.size > 0 ? ` (${subs.size})` : ''}
          </button>
          {subOpen && (
            <div className="absolute top-full left-0 z-20 mt-0.5 bg-white border border-gray-200 rounded shadow-lg min-w-[150px] py-1">
              {SUBS.map(({ id, label }) => (
                <label key={id} className="flex items-center gap-2 px-3 py-1 hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={subs.has(id)} onChange={() => toggleSub(id)}
                    className="w-3 h-3 accent-blue-600" />
                  <span className="text-xs text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <span className="text-gray-400 ml-1">로딩 중...</span>
        )}
      </div>

      {/* 차트 영역 */}
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  )
}
