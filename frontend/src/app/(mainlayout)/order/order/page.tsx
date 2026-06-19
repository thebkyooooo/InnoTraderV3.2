'use client'
import React, { useEffect, useState } from 'react'
import { Tabs } from '@/components/ui/Tabs'
import { QuoteBoard, OrderBook } from '@/components/quote'
import { AccountSelect, Holdings } from '@/components/account'
import { OrderForm, OrderHistory } from '@/components/order'
import { quoteApi, type QuotePriceResponse } from '@/features/quote/api/quote-api'

export default function OrderPage() {
  const [symbol, setSymbol] = useState('005930')
  const [quote, setQuote] = useState<QuotePriceResponse | null>(null)
  const [accountNo, setAccountNo] = useState('')
  const [hogaTabValue, setHogaTabValue] = useState('dom')
  const [orderTabValue, setOrderTabValue] = useState('order-history')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    quoteApi.getPrice(symbol)
      .then(res => setQuote(res.data))
      .catch(() => setQuote(null))
  }, [symbol])

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <div className="h-2xl:flex-1 flex flex-col-reverse sm:flex-row gap-4">
        {/* ─── 좌측 ─── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* 현재가 (Quote Board) */}
          <div className='hidden sm:block'>
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
          </div>

          {/* 호가 */}
          <div className="shrink-0 flex flex-col">
            <Tabs
              value={hogaTabValue}
              onChange={v => setHogaTabValue(String(v))}
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

          {/* 주문내역 / 보유주식 — 탭 전환 */}
          <div className="flex-1 shrink-0 flex flex-col">
            <Tabs
              value={orderTabValue}
              onChange={(v) => setOrderTabValue(String(v))}
              tabs={[
                { value: 'order-history', label: '주문내역' },
                { value: 'holdings', label: '보유주식' },
              ]}
            />
            <div className="flex-1 min-h-[320px]">
              {orderTabValue === 'order-history' && <OrderHistory key={`hist-${refreshKey}`} accountNo={accountNo} height="100%" todayOnly />}
              {orderTabValue === 'holdings'  && <Holdings key={`hold-${refreshKey}`} accountNo={accountNo} height="100%" showSummary={false} />}
            </div>
          </div>
        </div>

        {/* ─── 우측: 주문폼 ─── */}
        <div className="sm:w-[300px] 2xl:w-[360px] shrink-0 flex flex-col gap-4">
          <AccountSelect value={accountNo} onChange={setAccountNo} label="계좌 선택" placeholder="계좌번호를 선택하세요" />
          {/* 현재가 (Quote Board) */}
          <div className='sm:hidden'>
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
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <OrderForm
              accountNo={accountNo}
              symbol={symbol}
              name={quote?.name ?? ''}
              currentPrice={quote?.price}
              onOrdered={() => setRefreshKey(k => k + 1)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
