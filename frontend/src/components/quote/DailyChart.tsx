'use client'

import React, { useEffect, useRef, useMemo } from 'react'
import Box from '@mui/material/Box'
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  SeriesType,
  Time,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
} from 'lightweight-charts'
import { type DailyChartType } from '@/features/quote/api/quote-api'
import { useDailyChart } from '@/features/quote/api/use-quote'
import { useStockPriceWS } from '@/features/quote/api/use-quote-ws'

interface OHLCBar {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface DailyChartProps {
  /** 직접 OHLC 데이터를 넘기는 방식 (symbol 미지정 시 사용) */
  data?: OHLCBar[]
  /** 종목코드를 넘기면 내부에서 일봉을 직접 조회한다 */
  symbol?: string
  /** symbol 조회 시 일봉 유형 (기본 'D') */
  dailyType?: DailyChartType
  /** symbol 조회 시 조회 개수 (기본 120) */
  count?: number
  height?: number
  type?: 'candlestick' | 'line' | 'area'
}

const UP_COLOR   = '#ef5350'
const DOWN_COLOR = '#4285f4'

export function DailyChart({ data, symbol, dailyType = 'D', count = 120, height = 400, type = 'candlestick' }: DailyChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef     = useRef<IChartApi | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef    = useRef<ISeriesApi<SeriesType> | null>(null)

  // symbol이 주어지면 내부에서 일봉을 조회(React Query — 동시/중복 요청 dedupe), 아니면 data prop 사용
  const { data: page } = useDailyChart(symbol ?? '', dailyType, count, { enabled: !!symbol && !data })

  // 실시간 현재가 WS: symbol 있으면 전 dailyType에 연결
  const wsQuote = useStockPriceWS(symbol ?? '', !!symbol)

  const fetched = useMemo<OHLCBar[]>(() => {
    if (!page) return []
    // 최신→과거 정렬을 과거→최신으로 뒤집고 OHLCBar로 변환
    return page.items.slice().reverse().map(item => ({
      time: `${item.date.slice(0, 4)}-${item.date.slice(4, 6)}-${item.date.slice(6, 8)}`,
      open: item.open, high: item.high, low: item.low, close: item.price, volume: item.volume,
    }))
  }, [page])

  const bars = symbol ? fetched : (data ?? [])

  useEffect(() => {
    if (!containerRef.current) return
    const data = bars

    const isDark     = document.documentElement.classList.contains('dark')
    const hasVolume  = data.some((d) => d.volume != null)

    const chart = createChart(containerRef.current, {
      autoSize: true,
      height,
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#1e1e2e' : '#ffffff' },
        textColor: isDark ? '#cdd6f4' : '#333333',
      },
      grid: {
        vertLines: { color: isDark ? '#313244' : '#e5e7eb' },
        horzLines: { color: isDark ? '#313244' : '#e5e7eb' },
      },
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: isDark ? '#313244' : '#e5e7eb' },
      rightPriceScale: { borderColor: isDark ? '#313244' : '#e5e7eb' },
      localization: { priceFormatter: (p: number) => Math.round(p).toLocaleString('ko-KR') },
    })

    chartRef.current = chart

    // 거래량이 있으면 메인 가격 스케일을 위쪽 75%에 배치
    if (hasVolume) {
      chart.priceScale('right').applyOptions({
        scaleMargins: { top: 0.05, bottom: 0.25 },
      })
    }

    const priceFormat = { type: 'price' as const, precision: 0, minMove: 1 }

    if (type === 'candlestick') {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: UP_COLOR,
        downColor: DOWN_COLOR,
        borderVisible: false,
        wickUpColor: UP_COLOR,
        wickDownColor: DOWN_COLOR,
        priceFormat,
      })
      series.setData(
        data.map((d) => ({
          time: d.time as Time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }))
      )
      seriesRef.current = series
    } else if (type === 'line') {
      const series = chart.addSeries(LineSeries, { color: '#2962ff', lineWidth: 2, priceFormat })
      series.setData(data.map((d) => ({ time: d.time as Time, value: d.close })))
      seriesRef.current = series
    } else if (type === 'area') {
      const series = chart.addSeries(AreaSeries, {
        lineColor: '#2962ff',
        topColor: 'rgba(41, 98, 255, 0.3)',
        bottomColor: 'rgba(41, 98, 255, 0)',
        priceFormat,
      })
      series.setData(data.map((d) => ({ time: d.time as Time, value: d.close })))
      seriesRef.current = series
    }

    // 거래량 막대
    if (hasVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
        lastValueVisible: false,
        priceLineVisible: false,
      })
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      })
      volumeSeries.setData(
        data
          .filter((d) => d.volume != null)
          .map((d) => ({
            time: d.time as Time,
            value: d.volume!,
            color: d.close >= d.open
              ? 'rgba(239, 83, 80, 0.5)'
              : 'rgba(66, 133, 244, 0.5)',
          }))
      )
    }

    chart.timeScale().fitContent()

    return () => {
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [bars, height, type])

  // 실시간 현재가 반영 (전 dailyType)
  // 마지막 봉의 기존 time을 그대로 사용 → series 데이터의 time 형식/순서와 항상 일치
  useEffect(() => {
    if (!wsQuote || !seriesRef.current || !symbol || bars.length === 0) return

    const targetTime = bars[bars.length - 1].time as Time

    // type state 클로저 대신 실제 series 타입으로 판단 → 데이터 형태 불일치 방지
    const st = seriesRef.current.seriesType()
    if (st === 'Candlestick' || st === 'Bar') {
      seriesRef.current.update({ time: targetTime, open: wsQuote.open, high: wsQuote.high, low: wsQuote.low, close: wsQuote.price })
    } else {
      seriesRef.current.update({ time: targetTime, value: wsQuote.price })
    }
  }, [wsQuote, symbol, bars])

  return <Box ref={containerRef} sx={{ width: '100%', height }} />
}
