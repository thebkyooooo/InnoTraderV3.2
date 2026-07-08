'use client'
import { useState } from 'react'
import { Section } from '@/components/ui'
import { QuoteBoard, AnalysisChart, StockDetailCard } from '@/components/quote'

export default function QuoteChartPage() {
  const [symbol, setSymbol] = useState('005930')

  return (
    <div className="flex flex-col gap-4 w-full h-full">

      {/* 현재가 (Quote Board) 컴포넌트 — symbol만 넘기면 내부에서 조회 */}
      <Section>
        <QuoteBoard symbol={symbol} onStockSelect={stock => setSymbol(stock.symbol)} />
      </Section>

      <div className="flex-1 flex flex-col @[640px]:flex-row gap-4 w-full">
        {/* 분석차트 컴포넌트 */}
        <div className="flex-1 min-h-[480px] border border-gray-200 rounded-lg overflow-hidden p-4 bg-white">
          <AnalysisChart symbol={symbol} />
        </div>
      
        {/* 종목상세 컴포넌트 */}
        <div className="@[640px]:w-[280px] 2xl:w-[420px]">
          <Section>
            <StockDetailCard symbol={symbol} />
          </Section>
        </div>
      </div>

    </div>
  )
}
