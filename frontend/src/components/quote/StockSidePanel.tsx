'use client'
import React, { useEffect, useState } from 'react'
import { ArrowForwardIosSharp, TaskAlt } from '@mui/icons-material'
import { StockDetailCard } from './StockDetailCard'
import { DailyChart } from './DailyChart'

const UP = '#ef5350', DOWN = '#4285f4'
const fmt = (n: number) => (n ?? 0).toLocaleString('ko-KR')
const signColor = (v: number) => (v > 0 ? UP : v < 0 ? DOWN : '#6b7280')

// 패널 너비가 320→520px로 커지는 h-2xl-2xl 브레이크포인트(tailwind.config.ts)와 동일한 조건.
// height는 DailyChart가 차트 라이브러리 캔버스 픽셀값으로 그대로 쓰는 숫자라 CSS로는 못 바꾸고 JS로 감지해야 한다.
const LARGE_PANEL_QUERY = '(min-height: 1440px) and (min-width: 1536px)'

function useIsLargePanel() {
  const [isLarge, setIsLarge] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia(LARGE_PANEL_QUERY)
    const update = () => setIsLarge(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])
  return isLarge
}

export interface StockSidePanelStock {
  symbol: string
  name: string
  price: number
  prevDiff: number
  change: number
}

export interface StockSidePanelProps {
  /** 선택된 종목. null이면 "종목을 선택하세요" placeholder를 보여준다 */
  stock: StockSidePanelStock | null
  /** 패널 열림/닫힘 상태 */
  open: boolean
  /** 토글 버튼 클릭 시 호출 */
  onToggle: () => void
  /** 일봉 차트 높이. 미지정 시 패널 너비 브레이크포인트에 맞춰 260 / 420으로 자동 조정된다 */
  chartHeight?: number
}

/**
 * 종목 상세(현재가 헤더 + 일봉차트 + StockDetailCard)를 보여주는 토글형 사이드 패널.
 * 부모 컨테이너는 relative + flex(row)여야 토글 버튼/패널이 우측에 올바르게 배치된다.
 */
export function StockSidePanel({ stock, open, onToggle, chartHeight }: StockSidePanelProps) {
  const isLargePanel = useIsLargePanel()
  const resolvedChartHeight = chartHeight ?? (isLargePanel ? 420 : 260)

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={open}
        title={open ? '패널 숨기기' : '패널 보기'}
        className={`absolute hidden sm:block border border-gray-50 bg-slate-200 h-[40px] w-[20px] top-0.5 right-0.5 transition-transform duration-300 ease-in-out
                    ${open ? 'rounded-l-md' : 'rounded-r-md rotate-180'}`}
      >
        <ArrowForwardIosSharp sx={{ fontSize: 20, color: 'text.disabled', pb: '2px' }} />
      </button>

      <div
        aria-hidden={!open}
        className={`flex shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-in-out border-gray-200 sm:bg-white ${open ? 'sm:border-l sm:w-[320px] h-2xl-2xl:w-[520px] sm:opacity-100' : 'sm:w-0 sm:opacity-0'}`}
      >
        <div className="shrink-0 w-full flex flex-col gap-3 rounded-xl bg-white border border-gray-200 sm:rounded-none sm:border-none pt-0 sm:pt-2">
          {stock ? (
            <div className="w-full sm:w-[320px] h-2xl-2xl:w-[520px] flex flex-col gap-3.5 p-4">
              <div>
                {/* 선택 종목 헤더 */}
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold text-foreground truncate">{stock.name}</span>
                  <span className="text-xs text-gray-500">{stock.symbol}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold tabular-nums" style={{ color: signColor(stock.prevDiff) }}>
                    {fmt(stock.price)}
                  </span>
                  <span className="text-sm font-medium tabular-nums" style={{ color: signColor(stock.prevDiff) }}>
                    {stock.prevDiff > 0 ? '+' : ''}{fmt(stock.prevDiff)}
                    {' '}({stock.change > 0 ? '+' : ''}{Number(stock.change).toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* 일봉 차트 — symbol만 넘기면 DailyChart 내부에서 조회 */}
              <div className="rounded-lg border border-gray-200 overflow-hidden pl-2 pt-2">
                <DailyChart symbol={stock.symbol} height={resolvedChartHeight} type="candlestick" />
              </div>

              {/* 종목 상세 — symbol만 넘기면 내부에서 조회 */}
              <StockDetailCard symbol={stock.symbol} />
            </div>
          ) : (
            <div className="flex flex-col gap-2 h-[200px] sm:h-[unset] sm:flex-1 items-center justify-center text-center text-sm text-gray-400">
              <TaskAlt className="!text-[52px]" />
              <span>종목을 선택하세요</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
