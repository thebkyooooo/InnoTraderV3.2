'use client'
import { useState, useEffect } from 'react'
import { Section } from '@/components/ui/Section'
import { StockDetailCard, QuoteBoard, OrderBook } from '@/components/quote'
import { quoteApi, type QuotePriceResponse } from '@/features/quote/api/quote-api'

export default function QuoteOrderbookPage() {
  const [symbol, setSymbol] = useState('005930')
  const [quote, setQuote]   = useState<QuotePriceResponse | null>(null)

  useEffect(() => {
    quoteApi.getPrice(symbol)
      .then(res => setQuote(res.data))
      .catch(() => setQuote(null))
  }, [symbol])

  return (
    <div className="flex flex-col gap-4 w-full h-full">
    
      {/* <h1 className="text-lg font-bold text-foreground">일별</h1> */}

      {/* 현재가 (Quote Board) 컴포넌트 */}
      {quote && (
        <QuoteBoard
          symbol={quote.symbol}
          name={quote.name}
          market={quote.market}
          price={quote.price}
          prevDiff={quote.prevDiff}
          change={quote.change}
          volume={quote.volume}
          open={quote.open}
          high={quote.high}
          low={quote.low}
          prevClose={quote.prevClose}
          upperLimit={quote.upperLimit}
          lowerLimit={quote.lowerLimit}
          tradingAmount={quote.tradingAmount}
          onStockSelect={stock => setSymbol(stock.symbol)}
        />
      )}

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
