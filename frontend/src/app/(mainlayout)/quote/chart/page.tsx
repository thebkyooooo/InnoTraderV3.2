'use client'
import { useState, useEffect } from 'react'
import { Section } from '@/components/ui/Section'
import { StockDetailCard, QuoteBoard, AnalysisChart, DailyQuoteGrid, FilledQuoteGrid, InvestmentTrendGrid } from '@/components/quote'
import { quoteApi, type QuotePriceResponse } from '@/features/quote/api/quote-api'

export default function QuoteChartPage() {
  const [symbol, setSymbol] = useState('005930')
  const [quote, setQuote]   = useState<QuotePriceResponse | null>(null)

  useEffect(() => {
    quoteApi.getPrice(symbol)
      .then(res => setQuote(res.data))
      .catch(() => setQuote(null))
  }, [symbol])

  return (
    <div className="flex flex-col gap-4 w-full h-full">
    
      {/* <h1 className="text-lg font-bold text-foreground">분석차트</h1> */}

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

      {/* 분석차트 컴포넌트 */}
      <div className="flex-1 min-h-[480px] border border-gray-200 rounded-lg overflow-hidden">
        <AnalysisChart symbol={symbol} />
      </div>

    </div>
  )
}
