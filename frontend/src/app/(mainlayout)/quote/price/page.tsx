'use client'
import { useState } from 'react'
import { Tabs } from '@/components/ui/Tabs'
import { StockDetailCard, QuoteBoard, AnalysisChart, OrderBook, DailyQuoteGrid, FilledQuoteGrid, InvestmentTrendGrid } from '@/components/quote'

export default function QuotePricePage() {
  const [symbol, setSymbol]     = useState('005930')
  const [tabValue, setTabValue] = useState('filled')
  const [hogaTabValue, setHogaTabValue] = useState('dom')

  return (
    <div className="flex flex-col gap-4 w-full h-full">
    
      {/* <h1 className="text-lg font-bold text-foreground">현재가</h1> */}

      {/* 현재가 (Quote Board) 컴포넌트 — symbol만 넘기면 내부에서 조회 */}
      <QuoteBoard symbol={symbol} onStockSelect={stock => setSymbol(stock.symbol)} />


      <div className="h-2xl:flex-1 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* 분석차트 컴포넌트 */}
          <div className="h-[560px] h-2xl-sm:flex-1 shrink-0 border border-gray-200 rounded-lg overflow-hidden">
            <AnalysisChart symbol={symbol} />
          </div>

          {/* 호가 컴포넌트 */}
          <div className="shrink-0 flex flex-col">
            <Tabs
              value={hogaTabValue}
              onChange={(v) => setHogaTabValue(String(v))}
              tabs={[
                { value: 'dom', label: '호가 Dom' },
                { value: 'canvas', label: '호가 Canvas' },
              ]}
            />
            <div className="border border-gray-200 rounded-lg bg-white p-2">
              {hogaTabValue === 'dom' && <OrderBook symbol={symbol} variant="dom" />}
              {hogaTabValue === 'canvas' && <OrderBook symbol={symbol} variant="canvas" />}
            </div>
          </div>
          
          {/* 체결 / 일별 / 투자동향 — 탭 전환 */}
          <div className="shrink-0 flex flex-col">
            <Tabs
              value={tabValue}
              onChange={(v) => setTabValue(String(v))}
              tabs={[
                { value: 'filled', label: '체결' },
                { value: 'daily', label: '일별' },
                { value: 'trend', label: '투자동향' },
              ]}
            />
            <div className="h-[260px]">
              {tabValue === 'filled' && <FilledQuoteGrid symbol={symbol} />}
              {tabValue === 'daily'  && <DailyQuoteGrid symbol={symbol} />}
              {tabValue === 'trend'  && <InvestmentTrendGrid symbol={symbol} />}
            </div>
          </div>
        </div>

        <div className="sm:w-[280px] 2xl:w-[420px] flex flex-col gap-4">
          {/* 종목상세 컴포넌트 */}
          <StockDetailCard symbol={symbol} />
        </div>
      </div>

    </div>
  )
}
