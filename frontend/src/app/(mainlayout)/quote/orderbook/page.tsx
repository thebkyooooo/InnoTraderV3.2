'use client'
import { useState } from 'react'
import { Tabs, Section } from '@/components/ui'
import { QuoteBoard, OrderBook, StockDetailCard } from '@/components/quote'

export default function QuoteOrderbookPage() {
  const [symbol, setSymbol] = useState('005930')
  const [hogaTabValue, setHogaTabValue] = useState('dom')

  return (
    <div className="flex flex-col gap-4 w-full h-full @container">

      {/* 현재가 (Quote Board) 컴포넌트 — symbol만 넘기면 내부에서 조회 */}
      <Section className="min-h-[140px] !border-none" noPadding>
        <QuoteBoard symbol={symbol} onStockSelect={stock => setSymbol(stock.symbol)} />
      </Section>

      <div className="flex-1 flex flex-col @[640px]:flex-row @[640px]:items-start gap-4 w-full">
        {/* 호가 */}
        <div className="shrink-0 @[640px]:flex-1 flex flex-col border border-gray-200 rounded-lg bg-white p-4">
          <Tabs
            value={hogaTabValue}
            onChange={v => setHogaTabValue(String(v))}
            tabs={[
              { value: 'dom', label: '호가 Dom' },
              { value: 'canvas', label: '호가 Canvas' },
            ]}
          />
          {hogaTabValue === 'dom' && <OrderBook symbol={symbol} variant="dom" />}
          {hogaTabValue === 'canvas' && <OrderBook symbol={symbol} variant="canvas" />}
        </div>

        {/* 종목상세 컴포넌트 */}
        <div className="@[640px]:w-[280px] 2xl:w-[420px]">
          <StockDetailCard symbol={symbol} />
        </div>
      </div>
    </div>
  )
}
