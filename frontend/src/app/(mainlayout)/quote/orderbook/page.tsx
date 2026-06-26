'use client'
import { useState } from 'react'
import { QuoteBoard, OrderBook } from '@/components/quote'

export default function QuoteOrderbookPage() {
  const [symbol, setSymbol] = useState('005930')

  return (
    <div className="flex flex-col gap-4 w-full h-full">

      {/* 현재가 (Quote Board) 컴포넌트 — symbol만 넘기면 내부에서 조회 */}
      <QuoteBoard symbol={symbol} onStockSelect={stock => setSymbol(stock.symbol)} />

      {/* 호가 컴포넌트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <span className="text-sm font-semibold text-gray-600">DOM 기반</span>
          <div className='border border-gray-200 rounded-xl p-2 bg-white'>
            <OrderBook symbol={symbol} variant="dom" />
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <span className="text-sm font-semibold text-gray-600">Canvas 기반</span>
          <div className='border border-gray-200 rounded-xl p-2 bg-white'>
            <OrderBook symbol={symbol} variant="canvas" />
          </div>
        </div>
      </div>

    </div>
  )
}
