'use client'
import { useState, useEffect } from 'react'
import { Section } from '@/components/ui/Section'
import { StockDetailCard, QuoteBoard, AnalysisChart, DailyQuoteGrid, FilledQuoteGrid, InvestmentTrendGrid } from '@/components/quote'
import { quoteApi, type QuotePriceResponse } from '@/features/quote/api/quote-api'

export default function QuoteExecutionPage() {
  const [symbol, setSymbol] = useState('005930')
  const [quote, setQuote]   = useState<QuotePriceResponse | null>(null)

  useEffect(() => {
    quoteApi.getPrice(symbol)
      .then(res => setQuote(res.data))
      .catch(() => setQuote(null))
  }, [symbol])

  return (
    <div className="flex flex-col gap-4 w-full h-full">
    
      {/* <h1 className="text-lg font-bold text-foreground">체결</h1> */}

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

      {/* 체결 컴포넌트 */}
      <div className='flex-1 min-h-[260px] shrink-0'>
        <FilledQuoteGrid symbol={symbol} />
      </div>

    </div>
  )
}
