'use client'
import { useState } from 'react'
import { QuoteBoard, OrderBook, StockDetailCard } from '@/components/quote'

export default function QuoteOrderbookPage() {
  const [symbol, setSymbol] = useState('005930')

  return (
    <div className="flex flex-col gap-4 w-full xl:h-full">

      {/* 현재가 (Quote Board) 컴포넌트 — symbol만 넘기면 내부에서 조회 */}
      <QuoteBoard symbol={symbol} onStockSelect={stock => setSymbol(stock.symbol)} />

      <div className="@container h-2xl:flex-1 grid grid-cols-1 xl:grid-cols-[1fr_280px] 2xl:grid-cols-[1fr_480px] gap-4">
        
        {/* 호가 컴포넌트 */}
        <div className="grid grid-cols-1 @[640px]:grid-cols-2 gap-4 items-start">
          <div className="flex flex-col gap-2 border border-gray-200 rounded-xl px-4 py-4 bg-white">
            <span className="text-sm font-semibold text-gray-600">호가 DOM</span>
            <OrderBook symbol={symbol} variant="dom" />
          </div>
          <div className="flex flex-col gap-2 border border-gray-200 rounded-xl px-4 py-4 bg-white">
            <span className="text-sm font-semibold text-gray-600">호가 Canvas</span>
              <OrderBook symbol={symbol} variant="canvas" />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* 종목상세 컴포넌트 */}
          <StockDetailCard symbol={symbol} />
        </div>
      </div>
    </div>
  )
}
