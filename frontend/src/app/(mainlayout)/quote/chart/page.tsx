'use client'
import { useState } from 'react'
import { QuoteBoard, AnalysisChart } from '@/components/quote'

export default function QuoteChartPage() {
  const [symbol, setSymbol] = useState('005930')

  return (
    <div className="flex flex-col gap-4 w-full h-full">

      {/* 현재가 (Quote Board) 컴포넌트 — symbol만 넘기면 내부에서 조회 */}
      <QuoteBoard symbol={symbol} onStockSelect={stock => setSymbol(stock.symbol)} />

      {/* 분석차트 컴포넌트 */}
      <div className="flex-1 min-h-[480px] border border-gray-200 rounded-lg overflow-hidden">
        <AnalysisChart symbol={symbol} />
      </div>

    </div>
  )
}
