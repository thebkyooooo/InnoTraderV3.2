'use client'
import { useState } from 'react'
import { QuoteBoard, InvestmentTrendGrid } from '@/components/quote'

export default function QuoteTrendPage() {
  const [symbol, setSymbol] = useState('005930')

  return (
    <div className="flex flex-col gap-4 w-full h-full">

      {/* 현재가 (Quote Board) 컴포넌트 — symbol만 넘기면 내부에서 조회 */}
      <QuoteBoard symbol={symbol} onStockSelect={stock => setSymbol(stock.symbol)} />

      {/* 투자동향 컴포넌트 */}
      <div className='flex-1 min-h-[260px] shrink-0'>
        <InvestmentTrendGrid symbol={symbol} />
      </div>

    </div>
  )
}
