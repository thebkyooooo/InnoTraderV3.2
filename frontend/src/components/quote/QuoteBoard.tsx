'use client'
import React, { useState } from 'react'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { Section } from '@/components/ui/Section'
import { StockSearchModal } from './StockSearchModal'
import type { StockSummary } from '@/features/stock-master/api/stock-master-api'

export interface QuoteBoardProps {
  /** 종목코드 */
  symbol: string
  /** 종목명 */
  name: string
  /** 시장구분 (KOSPI / KOSDAQ) */
  market?: string
  /** 현재가 (원) */
  price: number
  /** 전일대비 (양수=상승, 음수=하락) */
  prevDiff: number
  /** 등락률 (%) */
  change: number
  /** 거래량 */
  volume: number
  /** 시가 */
  open: number
  /** 고가 */
  high: number
  /** 저가 */
  low: number
  /** 전일종가 */
  prevClose: number
  /** 상한가 */
  upperLimit: number
  /** 하한가 */
  lowerLimit: number
  /** 거래대금 (만원 단위) */
  tradingAmount: number
  /** 종목 선택 콜백 */
  onStockSelect?: (stock: StockSummary) => void
}

const UP_COLOR   = '#ef5350'
const DOWN_COLOR = '#4285f4'

function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR')
}

function formatAmount(manWon: number): string {
  if (manWon >= 100_000_000) return `${(manWon / 100_000_000).toFixed(1)}조`
  if (manWon >= 10_000)      return `${(manWon / 10_000).toFixed(1)}억`
  return `${formatNumber(manWon)}만`
}

export function QuoteBoard({
  symbol, name, market,
  price, prevDiff, change,
  volume, open, high, low, prevClose,
  upperLimit, lowerLimit, tradingAmount,
  onStockSelect,
}: QuoteBoardProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const isUp   = prevDiff > 0
  const isDown = prevDiff < 0
  const color  = isUp ? UP_COLOR : isDown ? DOWN_COLOR : undefined
  const arrow  = isUp ? '▲' : isDown ? '▼' : '-'

  const openColor = open > prevClose ? UP_COLOR : open < prevClose ? DOWN_COLOR : undefined

  const metrics = [
    { label: '거래량',   value: formatNumber(volume) },
    { label: '시가',     value: formatNumber(open),        color: openColor },
    { label: '고가',     value: formatNumber(high),        color: UP_COLOR },
    { label: '저가',     value: formatNumber(low),         color: DOWN_COLOR },
    { label: '전일',     value: formatNumber(prevClose) },
    { label: '상한가',   value: formatNumber(upperLimit),  color: UP_COLOR },
    { label: '하한가',   value: formatNumber(lowerLimit),  color: DOWN_COLOR },
    { label: '거래대금', value: formatAmount(tradingAmount) },
  ]

  return (
    <>
      <Section>
        <div className="flex gap-1 py-1 items-start">
          <span className='font-semibold'>{name}</span>
          <span className='text-xs py-0.5'>{symbol}</span>
          {market && <span className='text-xs py-0.5'>{market}</span>}
          <SearchOutlinedIcon
            className='ml-auto cursor-pointer'
            onClick={() => setModalOpen(true)}
          />
        </div>
        <div className="flex gapx-2 py-1 items-end">
          <span className='text-2xl font-semibold'>{formatNumber(price)}원</span>
          <span className='text-sm py-0.5' style={{ color }}>
            {arrow}{formatNumber(Math.abs(prevDiff))} {isUp ? '+' : isDown ? '-' : ''}{Math.abs(change).toFixed(2)}%
          </span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(132px,1fr))] gap-1 mt-3">
          {metrics.map(({ label, value, color }) => (
            <div
              key={label}
              className="flex justify-between border border-gray-100 rounded text-xs px-2 py-1 bg-slate-100"
            >
              <span className="text-[10px] text-left">{label}</span>
              <span className="text-right" style={{ color }}>{value}</span>
            </div>
          ))}
        </div>
      </Section>

      <StockSearchModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={(stock) => {
          onStockSelect?.(stock)
        }}
      />
    </>
  )
}
