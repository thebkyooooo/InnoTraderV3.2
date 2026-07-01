'use client'
import { useState } from 'react'
import { Section } from '@/components/ui'
import { QuoteBoard, DailyQuoteGrid, StockDetailCard } from '@/components/quote'

export default function QuoteDailyPage() {
  const [symbol, setSymbol] = useState('005930')

  return (
    <div className="flex flex-col gap-4 w-full h-full">

      {/* 현재가 (Quote Board) 컴포넌트 — symbol만 넘기면 내부에서 조회 */}
      <QuoteBoard symbol={symbol} onStockSelect={stock => setSymbol(stock.symbol)} />

      <div className="flex-1 flex flex-col @[640px]:flex-row gap-4 w-full">

        {/* 체결 컴포넌트 */}
        <Section className='flex-1 min-h-[260px] shrink-0'>
          <DailyQuoteGrid symbol={symbol} />
        </Section>

        <div className="@[640px]:w-[280px] 2xl:w-[420px]">
          {/* 종목상세 컴포넌트 */}
          <StockDetailCard symbol={symbol} />
        </div>
      </div>

    </div>
  )
}
