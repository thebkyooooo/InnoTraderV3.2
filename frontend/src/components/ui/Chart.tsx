'use client'

import React, { useEffect, useRef } from 'react'
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

interface OHLCBar {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

interface ChartProps {
  data: OHLCBar[]
  height?: number
  type?: 'candlestick' | 'line' | 'area'
}

const UP_COLOR   = '#ef5350'
const DOWN_COLOR = '#4285f4'

export function Chart({ data, height = 400, type = 'candlestick' }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef     = useRef<IChartApi | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef    = useRef<ISeriesApi<SeriesType> | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

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
  }, [data, height, type])

  return <Box ref={containerRef} sx={{ width: '100%', height }} />
}
