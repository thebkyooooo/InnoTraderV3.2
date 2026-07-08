'use client'
import { useState } from 'react'
import { Tabs } from '@/components/ui/Tabs'
import { QuoteBoard, OrderBook } from '@/components/quote'
import { AccountSelect, Holdings } from '@/components/account'
import { OrderForm, OrderHistory } from '@/components/order'
import { useStockPrice } from '@/features/quote/api/use-quote'
import { useStockPriceWS } from '@/features/quote/api/use-quote-ws'
import { Section } from '@/components/ui/Section'

export default function OrderPage() {
  const [symbol, setSymbol] = useState('005930')
  const [accountNo, setAccountNo] = useState('')
  const [hogaTabValue, setHogaTabValue] = useState('dom')
  const [orderTabValue, setOrderTabValue] = useState('holdings')
  const [refreshKey, setRefreshKey] = useState(0)
  // QuoteBoard 현재가 / OrderBook 호가 클릭 → OrderForm 가격 인풋에 반영 (nonce로 동일값 재클릭도 감지)
  const [priceSignal, setPriceSignal] = useState<{ price: number; nonce: number } | null>(null)
  const handlePriceClick = (price: number) => setPriceSignal(prev => ({ price, nonce: (prev?.nonce ?? 0) + 1 }))

  // 페이지가 시세를 받아 QuoteBoard(제어형)·OrderForm에 공유한다.
  // REST 초기 스냅샷(연결 전 빈 화면 방지) + WS 실시간 갱신 → 공유 quote가 2초마다 갱신된다.
  const { data: snapshot = null } = useStockPrice(symbol)
  const wsQuote = useStockPriceWS(symbol)
  const quote = wsQuote ?? snapshot

  return (
    <div className="@container flex flex-col gap-4 w-full h-full">
      <div className="h-xl:flex-1 flex flex-col-reverse @[640px]:flex-row gap-4">
        {/* ─── 좌측 ─── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* 현재가 (Quote Board) */}
          <div className='hidden @[640px]:block'>
            <Section>
              {quote && (
                <QuoteBoard symbol={quote.symbol} quote={quote} onStockSelect={stock => setSymbol(stock.symbol)} onPriceClick={handlePriceClick} />
              )}
            </Section>
          </div>

          {/* 호가 */}
          <div className="shrink-0 flex flex-col border border-gray-200 rounded-lg bg-white p-4">
            <Tabs
              value={hogaTabValue}
              onChange={v => setHogaTabValue(String(v))}
              tabs={[
                { value: 'dom', label: '호가 Dom' },
                { value: 'canvas', label: '호가 Canvas' },
              ]}
            />
            {hogaTabValue === 'dom' && <OrderBook symbol={symbol} variant="dom" onPriceClick={handlePriceClick} />}
            {hogaTabValue === 'canvas' && <OrderBook symbol={symbol} variant="canvas" onPriceClick={handlePriceClick} />}
            
          </div>

          {/* 주문내역 / 보유주식 — 탭 전환 */}
          <div className="shrink-0 flex-1 flex flex-col border border-gray-200 rounded-lg bg-white p-4">
            
            <Tabs
              value={orderTabValue}
              onChange={(v) => setOrderTabValue(String(v))}
              tabs={[
                { value: 'holdings', label: '보유주식' },
                { value: 'order-history', label: '주문내역' },
              ]}
            />
            <div className="flex-1 min-h-[320px]">
              {orderTabValue === 'holdings'  && <Holdings key={`hold-${refreshKey}`} accountNo={accountNo} height="100%" showSummary={false} onSymbolSelect={setSymbol} />}
              {orderTabValue === 'order-history' && <OrderHistory key={`hist-${refreshKey}`} accountNo={accountNo} height="100%" todayOnly onSymbolSelect={setSymbol} />}
            </div>
          </div>
        </div>

        {/* ─── 우측: 주문폼 ─── */}
        <div className="@[640px]:w-[300px] 2xl:w-[360px] shrink-0 flex flex-col gap-4">
          <div className='pt-2'>
            <AccountSelect value={accountNo} onChange={setAccountNo} label="계좌 선택" placeholder="계좌번호를 선택하세요" />
          </div>
          {/* 현재가 (Quote Board) */}
          <div className='@[640px]:hidden'>
            <Section>
              {quote && (
                <QuoteBoard symbol={quote.symbol} quote={quote} onStockSelect={stock => setSymbol(stock.symbol)} onPriceClick={handlePriceClick} />
              )}
            </Section>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <OrderForm
              accountNo={accountNo}
              symbol={symbol}
              name={quote?.name ?? ''}
              currentPrice={quote?.price}
              priceSignal={priceSignal}
              onOrdered={() => setRefreshKey(k => k + 1)}
            />
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <OrderHistory key={`hist-${refreshKey}`} accountNo={accountNo} height="100%" todayOnly onSymbolSelect={setSymbol} />
          </div>
          
        </div>
      </div>
    </div>
  )
}
