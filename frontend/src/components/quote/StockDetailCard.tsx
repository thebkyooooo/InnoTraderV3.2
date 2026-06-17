'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { quoteApi, type QuoteDetailItem } from '@/features/quote/api/quote-api'
import { Section } from '@/components/ui/Section'

const UP   = '#ef5350'
const DOWN = '#4285f4'

function fmtNum(n: number) { return n.toLocaleString('ko-KR') }
function fmtCap(n: number) {
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(2)}조`
  if (n >= 100_000_000)       return `${(n / 100_000_000).toFixed(0)}억`
  return fmtNum(n)
}

export interface StockDetailCardProps {
  symbol: string
}

export function StockDetailCard({ symbol }: StockDetailCardProps) {
  const [data, setData]       = useState<QuoteDetailItem | null>(null)
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(() => {
    setLoading(true)
    quoteApi.getDetail(symbol)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [symbol])

  useEffect(() => { fetch() }, [fetch])

  if (loading) {
    return <div className="text-xs text-gray-400 py-4 text-center">불러오는 중...</div>
  }
  if (!data) return null

  const rows: { label: string; value: string; color?: string }[] = [
    { label: '종목명',    value: data.name },
    { label: '종목코드',  value: data.symbol },
    { label: '시가총액',  value: fmtCap(data.marketCap) },
    { label: '상장주식수', value: `${fmtNum(data.lstdShrs)}주` },
    { label: '액면가',   value: `${fmtNum(data.parValue)}원` },
    { label: '상한가',   value: fmtNum(data.upperLimit), color: UP },
    { label: '하한가',   value: fmtNum(data.lowerLimit), color: DOWN },
    { label: '52주최고', value: fmtNum(data.high52w),   color: UP },
    { label: '52주최저', value: fmtNum(data.low52w),    color: DOWN },
    { label: 'PER/PBR',     value: `${data.per.toFixed(1)}배/${data.pbr.toFixed(2)}배` },
    { label: 'EPS',     value: `${fmtNum(data.eps)}원` },
    { label: 'BPS',     value: `${fmtNum(data.bps)}원` },
  ]

  return (
    <Section>
      <div className="grid grid-cols-1 gap-px overflow-hidden text-xs border-t border-b border-gray-100">
        {rows.map(({ label, value, color }) => (
          <div key={label} className="flex justify-between items-center px-0 py-1.5 bg-white border-b border-gray-100 last:border-b-0">
            <span className="text-gray-500 shrink-0">{label}</span>
            <span className="font-medium ml-2 text-right" style={{ color }}>{value}</span>
          </div>
        ))}
      </div>
    </Section>
  )
}
