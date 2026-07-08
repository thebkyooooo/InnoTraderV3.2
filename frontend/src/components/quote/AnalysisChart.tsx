'use client'
import { useState, useEffect, useRef, useCallback, type PointerEvent as RPointerEvent, type MouseEvent as RMouseEvent } from 'react'
import {
  createChart, ColorType, IChartApi, ISeriesApi, SeriesType, Time,
  CandlestickSeries, LineSeries, AreaSeries, HistogramSeries, BarSeries,
  type LogicalRange,
} from 'lightweight-charts'
import { quoteApi, type DailyChartType } from '@/features/quote/api/quote-api'
import * as ind from './_chartIndicators'
import { useStockPriceWS } from '@/features/quote/api/use-quote-ws'

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

const SUB_PRICE_FORMAT = { type: 'price' as const, precision: 0, minMove: 1 }
const SUB_SCALE_MARGINS = { scaleMargins: { top: 0.1, bottom: 0 } }

function mkLine(chart: IChartApi, color: string, pane: number, width: 1 | 2 | 3 | 4 = 1) {
  const s = chart.addSeries(LineSeries, { color, lineWidth: width, lastValueVisible: false, priceLineVisible: false, priceFormat: SUB_PRICE_FORMAT }, pane)
  if (pane > 0) s.priceScale().applyOptions(SUB_SCALE_MARGINS)
  return s
}

function mkHist(chart: IChartApi, pane: number) {
  const s = chart.addSeries(HistogramSeries, { lastValueVisible: false, priceLineVisible: false, priceFormat: SUB_PRICE_FORMAT }, pane)
  if (pane > 0) s.priceScale().applyOptions(SUB_SCALE_MARGINS)
  return s
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

// 분봉 date("20260626")+time("093000") → UNIX 초.
// crosshair/축이 getUTC* 로 렌더하므로 UTC로 만들어 KST 거래시각이 그대로 표시되게 한다.
function timeBarToTs(date: string, time: string): number {
  return Date.UTC(
    +date.slice(0, 4), +date.slice(4, 6) - 1, +date.slice(6, 8),
    +time.slice(0, 2), +time.slice(2, 4), +time.slice(4, 6),
  ) / 1000
}

// ── Chart Builder ─────────────────────────────────────────────────────────────

type BuildResult = { chart: IChartApi; mainSeries: ISeriesApi<SeriesType>; volSeries: ISeriesApi<SeriesType> | null }

function buildChart(
  container: HTMLElement,
  bars: Bar[],
  chartType: ChartType,
  activeOverlays: Set<string>,
  activeSubs: Set<string>,
): BuildResult {
  const isDark = document.documentElement.classList.contains('dark')

  const chart = createChart(container, {
    autoSize: true,
    layout: {
      background: { type: ColorType.Solid, color: isDark ? '#1e1e2e' : '#ffffff' },
      textColor: isDark ? '#cdd6f4' : '#333',
    },
    grid: {
      vertLines: { color: isDark ? '#313244' : '#e5e7eb' },
      horzLines: { color: isDark ? '#313244' : '#e5e7eb' },
    },
    timeScale: { timeVisible: true, secondsVisible: false, borderColor: isDark ? '#313244' : '#e5e7eb', rightOffset: 5 },
    rightPriceScale: { borderColor: isDark ? '#313244' : '#e5e7eb' },
    localization: { timeFormatter: fmtCrosshairTime, priceFormatter: (p: number) => Math.round(p).toLocaleString('ko-KR') },
    crosshair: { mode: 1 },
  })

  const closes  = bars.map(b => b.close)
  const highs   = bars.map(b => b.high)
  const lows    = bars.map(b => b.low)
  const volumes = bars.map(b => b.volume)

  // eslint-disable-next-line prefer-const
  let mainSeries!: ISeriesApi<SeriesType>
  let volSeries: ISeriesApi<SeriesType> | null = null

  // ── 가격 시리즈 (pane 0) ──────────────────────────────────────────────────

  const priceScale = { scaleMargins: { top: 0.08, bottom: 0.04 } }
  const priceFormat = { type: 'price' as const, precision: 0, minMove: 1 }

  if (chartType === 'candlestick') {
    const s = chart.addSeries(CandlestickSeries, {
      upColor: UP, downColor: DOWN, borderVisible: false, wickUpColor: UP, wickDownColor: DOWN, priceFormat,
    }, 0)
    s.setData(bars.map(b => ({ time: b.time, open: b.open, high: b.high, low: b.low, close: b.close })))
    s.priceScale().applyOptions(priceScale)
    mainSeries = s
  } else if (chartType === 'bar') {
    const s = chart.addSeries(BarSeries, { upColor: UP, downColor: DOWN, priceFormat }, 0)
    s.setData(bars.map(b => ({ time: b.time, open: b.open, high: b.high, low: b.low, close: b.close })))
    s.priceScale().applyOptions(priceScale)
    mainSeries = s
  } else if (chartType === 'line') {
    const s = chart.addSeries(LineSeries, { color: UP, lineWidth: 2, priceFormat }, 0)
    s.setData(bars.map(b => ({ time: b.time, value: b.close })))
    s.priceScale().applyOptions(priceScale)
    mainSeries = s
  } else {
    const s = chart.addSeries(AreaSeries, { lineColor: UP, topColor: 'rgba(239,83,80,0.25)', bottomColor: 'rgba(239,83,80,0)', priceFormat }, 0)
    s.setData(bars.map(b => ({ time: b.time, value: b.close })))
    s.priceScale().applyOptions(priceScale)
    mainSeries = s
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
      volSeries = s

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

  // ── pane 높이 비율 조정 (메인 : 보조 = 4 : 1) ─────────────────────────────
  const panes = chart.panes()
  panes[0]?.setStretchFactor(4)
  for (let i = 1; i < panes.length; i++) panes[i]?.setStretchFactor(1)

  return { chart, mainSeries, volSeries }
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
  const [hoverBar, setHoverBar]   = useState<Bar | null>(null)
  const [loading, setLoading]     = useState(false)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [subOpen, setSubOpen]         = useState(false)
  const [overlayPos, setOverlayPos]   = useState<{ top: number; left: number } | null>(null)
  const [subPos, setSubPos]           = useState<{ top: number; left: number } | null>(null)

  const containerRef        = useRef<HTMLDivElement>(null)
  const chartRef            = useRef<IChartApi | null>(null)
  const hasMoreRef          = useRef(false)
  const loadingRef          = useRef(false)
  const cursorRef           = useRef<string | null>(null)
  const loadMoreFnRef       = useRef<(() => void) | null>(null)
  const savedRangeRef        = useRef<{ from: Time; to: Time } | null>(null)
  const armedRef             = useRef(true)
  const mainSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null)
  const volSeriesRef  = useRef<ISeriesApi<SeriesType> | null>(null)
  // 분봉 실시간 롤오버용 진행 봉(현재 기간) OHLC 누적
  const liveMinRef = useRef<{ time: number; open: number; high: number; low: number; vol: number } | null>(null)
  // 현재 시리즈가 어느 모드로 생성됐는지 — mode 전환 중 시간 타입 불일치 update 방지
  const seriesModeRef = useRef<ChartMode | null>(null)
  const resetPendingRef      = useRef(false)
  const viewCountRef         = useRef(MIN_VIEW)
  const overlayRef          = useRef<HTMLDivElement>(null)
  const subRef              = useRef<HTMLDivElement>(null)
  const scrollRef           = useRef<HTMLDivElement>(null)
  const dragRef             = useRef({ active: false, startX: 0, startLeft: 0, moved: false })

  const wsQuote = useStockPriceWS(symbol)

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
        const reversed  = page.items.slice().reverse()

        // API의 실제 거래일(date)+시각(time)으로 타임스탬프 생성 → 축 라벨이 API 값과 일치
        const converted: Bar[] = reversed.map(item => ({
          time: timeBarToTs(item.date, item.time) as Time,
          open: item.open, high: item.high, low: item.low, close: item.price, volume: item.filledVolume,
        }))
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
    liveMinRef.current = null   // 진행 봉 누적 상태 초기화
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

    const { chart, mainSeries, volSeries } = buildChart(containerRef.current, bars, chartType, overlays, subs)
    chartRef.current = chart
    mainSeriesRef.current = mainSeries
    volSeriesRef.current = volSeries
    seriesModeRef.current = mode   // 이 시리즈가 생성된 모드 기록 (전환 중 WS 갱신 가드)

    // crosshair 이동 → 해당 봉 OHLCV 표시 (벗어나면 최신 봉)
    const barByTime = new Map(bars.map(b => [b.time, b]))
    const crosshairHandler = (param: { time?: Time }) => {
      setHoverBar(param.time != null ? barByTime.get(param.time) ?? null : null)
    }
    chart.subscribeCrosshairMove(crosshairHandler)

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
        chart.timeScale().setVisibleLogicalRange({ from: n - view, to: n + 4 })
      } else {
        chart.timeScale().fitContent()
      }
    }

    return () => {
      if (!resetPendingRef.current) savedRangeRef.current = chart.timeScale().getVisibleRange()
      resetPendingRef.current = false
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(rangeHandler)
      chart.unsubscribeCrosshairMove(crosshairHandler)
      chart.remove()
      chartRef.current = null
      mainSeriesRef.current = null
      volSeriesRef.current = null
      seriesModeRef.current = null
    }
  }, [bars, chartType, overlays, subs])

  // ── 실시간 현재가 반영 (전 차트 모드) ──────────────────────────────────────
  // 분봉: 진행 봉 OHLC만 누적 갱신, 기간 경과 시 새 봉 add (캔들 거대화 방지 + 롤오버)
  // 일봉류(D/W/M/Y): 마지막 봉의 OHLC를 현재가로 확장 갱신
  useEffect(() => {
    if (!wsQuote || !mainSeriesRef.current || bars.length === 0) return
    // 시리즈가 아직 현재 모드로 재생성되지 않음(전환 중) → 시간 타입 불일치 방지 위해 skip
    if (seriesModeRef.current !== mode) return

    const lastBar = bars[bars.length - 1]
    const price = wsQuote.price

    // 갱신/추가할 봉 (time + OHLC)
    let bar: { time: Time; open: number; high: number; low: number; close: number }
    let volTime: Time
    let volValue: number

    if (mode === 'minute' && typeof lastBar.time === 'number' && wsQuote.date && wsQuote.time) {
      const periodSec = minPeriod * 60
      const periodStart = Math.floor(timeBarToTs(wsQuote.date, wsQuote.time) / periodSec) * periodSec

      // 분봉 거래량 바는 분당 체결량 스케일 — wsQuote.volume(일 누적)을 기간 비율로 환산
      // (누적값을 그대로 쓰면 거래량 바가 비정상적으로 커짐)
      const perPeriodVol = Math.round(wsQuote.volume * minPeriod / 390)

      if (periodStart > (lastBar.time as number)) {
        // ── 기간 경과 → 새 봉 (add) ──
        // 표준 캔들: 시가 = 기간 시작 현재가, 고가/저가는 종가가 도달할 때만 갱신(max/min)
        let live = liveMinRef.current
        if (!live || live.time !== periodStart) {
          // 새 봉은 도지(시가=고가=저가=종가=현재가)로 시작
          live = { time: periodStart, open: price, high: price, low: price, vol: perPeriodVol }
        } else {
          // 종가(현재가)가 고가를 넘으면 고가 갱신, 저가 밑으로 가면 저가 갱신
          live.high = Math.max(live.high, price)
          live.low  = Math.min(live.low, price)
          live.vol  = perPeriodVol
        }
        liveMinRef.current = live
        bar = { time: periodStart as Time, open: live.open, high: live.high, low: live.low, close: price }
        volTime = periodStart as Time
        volValue = live.vol
      } else {
        // ── 같은 기간(또는 마지막 봉) → 진행 봉 갱신 (liveMinRef로 누적 추적) ──
        let live = liveMinRef.current
        if (!live || live.time !== (lastBar.time as number)) {
          live = { time: lastBar.time as number, open: lastBar.open, high: lastBar.high, low: lastBar.low, vol: lastBar.volume }
        }
        live.high = Math.max(live.high, price)
        live.low  = Math.min(live.low,  price)
        liveMinRef.current = live
        bar = { time: lastBar.time, open: live.open, high: live.high, low: live.low, close: price }
        volTime = lastBar.time
        volValue = live.vol
      }
    } else {
      // ── 일봉/주봉/월봉/년봉: 마지막 봉을 현재가로 확장 갱신 ──
      bar = { time: lastBar.time, open: lastBar.open, high: Math.max(lastBar.high, price), low: Math.min(lastBar.low, price), close: price }
      volTime = lastBar.time
      volValue = wsQuote.volume
    }

    // chartType state 클로저 대신 실제 series 타입으로 판단 → 데이터 형태 불일치 방지
    // 전환 race로 드물게 시간 역행 update가 발생해도 차트가 깨지지 않도록 try/catch
    try {
      const st = mainSeriesRef.current.seriesType()
      if (st === 'Candlestick' || st === 'Bar') {
        mainSeriesRef.current.update({ time: bar.time, open: bar.open, high: bar.high, low: bar.low, close: bar.close })
      } else {
        mainSeriesRef.current.update({ time: bar.time, value: bar.close })
      }
      volSeriesRef.current?.update({
        time: volTime, value: volValue,
        color: price >= bar.open ? 'rgba(239,83,80,0.6)' : 'rgba(66,133,244,0.6)',
      })
    } catch {
      // 전환 중 일시적 불일치 — 다음 틱에서 정상 갱신
    }
  }, [wsQuote, mode, minPeriod, bars])

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

  // ── 툴바 가로 드래그 스크롤 (마우스). 터치는 native 스크롤이 처리 ──────────
  const onTbPointerDown = (e: RPointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const el = scrollRef.current; if (!el) return
    dragRef.current = { active: true, startX: e.clientX, startLeft: el.scrollLeft, moved: false }
  }
  const onTbPointerMove = (e: RPointerEvent) => {
    const el = scrollRef.current, d = dragRef.current
    if (!el || !d.active) return
    const dx = e.clientX - d.startX
    if (Math.abs(dx) > 3) d.moved = true
    el.scrollLeft = d.startLeft - dx
  }
  const onTbPointerUp = () => { dragRef.current.active = false }
  // 드래그로 이동한 경우 버튼 클릭(선택) 억제
  const onTbClickCapture = (e: RMouseEvent) => {
    if (dragRef.current.moved) { e.stopPropagation(); e.preventDefault(); dragRef.current.moved = false }
  }
  const onTbScroll = () => { setOverlayOpen(false); setSubOpen(false) }

  // ── 드롭다운 열기: 트리거 버튼 위치 기준으로 fixed 패널 배치 ────────────────
  const openMenu = (e: RMouseEvent, which: 'overlay' | 'sub') => {
    const r = e.currentTarget.getBoundingClientRect()
    const pos = { top: r.bottom + 2, left: r.left }
    if (which === 'overlay') {
      setSubOpen(false)
      setOverlayOpen(v => { if (!v) setOverlayPos(pos); return !v })
    } else {
      setOverlayOpen(false)
      setSubOpen(v => { if (!v) setSubPos(pos); return !v })
    }
  }

  // ── UI ─────────────────────────────────────────────────────────────────────

  const btnBase = 'px-2 py-1 text-xs rounded transition-colors shrink-0 whitespace-nowrap'
  const btnActive = 'bg-blue-600 text-white'
  const btnInactive = 'bg-gray-200 text-gray-600 hover:bg-gray-200'

  // ── 상단 OHLCV 범례 (hover 봉 우선, 없으면 최신 봉) ─────────────────────────
  const dispIdx = hoverBar
    ? bars.findIndex(b => b.time === hoverBar.time)
    : bars.length - 1
  const disp = bars[dispIdx]

  // 미호버 + WS 수신 시 실시간 현재가로 레전드 대체 (전 모드)
  // 분봉: 진행 봉(마지막 봉) 기준 — 당일 OHLC를 쓰면 캔들과 불일치하므로
  const isLive = !hoverBar && !!wsQuote
  const liveDisp = isLive && wsQuote
    ? (mode === 'minute' && disp
        ? (() => { const lv = liveMinRef.current; return { open: lv?.open ?? disp.open, high: Math.max(lv?.high ?? disp.high, wsQuote.price), low: Math.min(lv?.low ?? disp.low, wsQuote.price), close: wsQuote.price, volume: disp.volume } })()
        : { open: wsQuote.open, high: wsQuote.high, low: wsQuote.low, close: wsQuote.price, volume: wsQuote.volume })
    : disp
  const prevClose = isLive && wsQuote ? wsQuote.prevClose : (bars[dispIdx - 1]?.close ?? disp?.open)
  const diff      = isLive && wsQuote ? wsQuote.prevDiff  : (liveDisp ? liveDisp.close - prevClose : 0)
  const changePct = isLive && wsQuote ? wsQuote.change    : (prevClose ? (diff / prevClose) * 100 : 0)
  const upColor = diff >= 0 ? UP : DOWN
  const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR')
  // 각 값을 전봉 종가 대비 개별 색상 (한국 HTS 관례)
  const valColor = (v: number) => (v > prevClose ? UP : v < prevClose ? DOWN : '#6b7280')

  return (
    <div className="flex flex-col gap-2 h-full overflow-hidden -mb-2 bg-white">
      {/* 툴바 (가로 스크롤 + 마우스 드래그/터치 이동) */}
      <div
        ref={scrollRef}
        onPointerDown={onTbPointerDown}
        onPointerMove={onTbPointerMove}
        onPointerUp={onTbPointerUp}
        onPointerLeave={onTbPointerUp}
        onClickCapture={onTbClickCapture}
        onScroll={onTbScroll}
        className="flex flex-nowrap items-center gap-1.5 shrink-0 text-xs overflow-x-auto cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >

        {/* 조회 모드 */}
        <div className="flex gap-0 rounded border-0 overflow-hidden shrink-0">
          {(['daily', 'minute'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-2.5 py-1 ${mode === m ? btnActive : btnInactive} rounded-none`}>
              {m === 'minute' ? '분' : '일'}
            </button>
          ))}
        </div>

        {/* 분봉 서브 */}
        {mode === 'minute' && (
          <div className="flex gap-0.5 shrink-0">
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
          <div className="flex gap-0.5 shrink-0">
            {(['D','W','M','Y'] as DailyChartType[]).map(t => (
              <button key={t} onClick={() => setDailyType(t)}
                className={`${btnBase} ${dailyType === t ? btnActive : btnInactive}`}>
                {t === 'D' ? '일' : t === 'W' ? '주' : t === 'M' ? '월' : '년'}
              </button>
            ))}
          </div>
        )}

        <div className="w-px h-4 bg-gray-200 mx-0.5 shrink-0" />

        {/* 차트 유형 */}
        <div className="flex gap-0.5 shrink-0">
          {([
            ['candlestick','캔들'],['bar','바'],['line','라인'],['area','영역']
          ] as [ChartType,string][]).map(([t, label]) => (
            <button key={t} onClick={() => setChartType(t)}
              className={`${btnBase} ${chartType === t ? btnActive : btnInactive}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-gray-200 mx-0.5 shrink-0" />

        {/* 오버레이 드롭다운 */}
        <div ref={overlayRef} className="relative shrink-0">
          <button onClick={e => openMenu(e, 'overlay')}
            className={`${btnBase} border ${overlayOpen ? 'border-blue-400 text-blue-600' : 'border-gray-200 text-gray-600'} bg-white hover:bg-gray-50`}>
            오버레이{overlays.size > 0 ? ` (${overlays.size})` : ''}
          </button>
          {overlayOpen && overlayPos && (
            <div className="fixed z-30 bg-white border border-gray-200 rounded shadow-lg min-w-[150px] py-1"
              style={{ top: overlayPos.top, left: overlayPos.left }}>
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
        <div ref={subRef} className="relative shrink-0">
          <button onClick={e => openMenu(e, 'sub')}
            className={`${btnBase} border ${subOpen ? 'border-blue-400 text-blue-600' : 'border-gray-200 text-gray-600'} bg-white hover:bg-gray-50`}>
            보조지표{subs.size > 0 ? ` (${subs.size})` : ''}
          </button>
          {subOpen && subPos && (
            <div className="fixed z-30 bg-white border border-gray-200 rounded shadow-lg min-w-[150px] py-1"
              style={{ top: subPos.top, left: subPos.left }}>
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
          <span className="text-gray-400 ml-1 shrink-0 whitespace-nowrap">로딩 중...</span>
        )}
      </div>

      {/* 차트 영역 */}
      <div className="relative flex-1 min-h-0 border-t border-gray-200 -mb-2">
        {disp && (
          <div className="absolute top-1.5 left-0.5 z-10 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs pointer-events-none select-none w-[calc(100%-100px)]">
            {([['시', liveDisp?.open], ['고', liveDisp?.high], ['저', liveDisp?.low], ['종', liveDisp?.close]] as [string, number][]).map(([l, v]) => (
              <span key={l} className="flex items-center gap-1">
                <span className="text-gray-400">{l}</span>
                <span className="font-medium tabular-nums" style={{ color: valColor(v) }}>{fmt(v)}</span>
              </span>
            ))}
            <span className="flex items-center gap-1">
              <span className="font-medium tabular-nums" style={{ color: upColor }}>
                {diff >= 0 ? '+' : ''}{fmt(diff)} ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
              </span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-gray-400">거래량</span>
              <span className="font-medium tabular-nums text-gray-600">{fmt(liveDisp?.volume ?? 0)}</span>
            </span>
          </div>
        )}
        <div ref={containerRef} className="absolute inset-0" />
      </div>
    </div>
  )
}
