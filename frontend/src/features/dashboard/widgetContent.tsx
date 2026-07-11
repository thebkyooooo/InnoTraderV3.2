import React from 'react'
import { StockDetailCard, QuoteBoard, AnalysisChart, OrderBook, DailyQuoteGrid, FilledQuoteGrid, InvestmentTrendGrid } from '@/components/quote'
import { AccountSelect, Holdings } from '@/components/account'
import { OrderForm, OrderHistory } from '@/components/order'
import type { WidgetDashboardState } from './useWidgetDashboardState'

/**
 * 위젯 id 목록 — dockview/FlexLayout은 탭을 기본 지원하므로 react-grid-layout 버전에서
 * 커스텀 탭으로 묶었던 'filled-daily-trend'/'orderbook'을 각 구성요소로 분리했다.
 */
export const WIDGET_IDS = [
  'quote-board', 'analysis-chart', 'filled', 'daily', 'trend',
  'order-form', 'order-history', 'holdings', 'stock-detail',
  'orderbook-dom', 'orderbook-canvas',
] as const

export type WidgetId = typeof WIDGET_IDS[number]

export const WIDGET_TITLES: Record<WidgetId, string> = {
  'quote-board': '현재가',
  'analysis-chart': '분석차트',
  'filled': '체결',
  'daily': '일별',
  'trend': '투자동향',
  'order-form': '주문',
  'order-history': '주문내역',
  'holdings': '보유주식',
  'stock-detail': '종목상세',
  'orderbook-dom': '호가 Dom',
  'orderbook-canvas': '호가 Canvas',
}

/** 위젯 id → 콘텐츠 (기존 react-grid-layout 위젯 대시보드와 동일 컴포넌트 재사용). */
export function renderWidgetContent(id: string, s: WidgetDashboardState): React.ReactNode {
  switch (id as WidgetId) {
    case 'quote-board':
      return ( 
        <div className='h-full overflow-auto'>
          <QuoteBoard symbol={s.symbol} onStockSelect={stock => s.setSymbol(stock.symbol)} onPriceClick={s.handlePriceClick} />
        </div>
      )
    case 'analysis-chart':
      return <div className='w-full h-full'><AnalysisChart symbol={s.symbol} /></div>
    case 'filled':
      return <FilledQuoteGrid symbol={s.symbol} />
    case 'daily':
      return <DailyQuoteGrid symbol={s.symbol} />
    case 'trend':
      return <InvestmentTrendGrid symbol={s.symbol} />
    case 'orderbook-dom':
      return ( 
        <div className='h-full overflow-auto'>
          <OrderBook symbol={s.symbol} variant="dom" onPriceClick={s.handlePriceClick} />
        </div>
      )
    case 'orderbook-canvas':
      return ( 
        <div className='h-full overflow-auto'>
          <OrderBook symbol={s.symbol} variant="canvas" onPriceClick={s.handlePriceClick} />
        </div>
      )
    case 'stock-detail':
      return ( 
        <div className='h-full overflow-auto'>
          <StockDetailCard symbol={s.symbol} />
        </div>
      )
    case 'order-form':
      return (
        <div className='flex flex-col gap-3 h-full overflow-auto pt-2'>
          <AccountSelect value={s.accountNo} onChange={s.setAccountNo} label="계좌 선택" placeholder="계좌번호를 선택하세요" size="small" />
          <OrderForm
            accountNo={s.accountNo}
            symbol={s.symbol}
            name={s.quote?.name ?? ''}
            currentPrice={s.quote?.price}
            priceSignal={s.priceSignal}
            onOrdered={() => s.setRefreshKey(k => k + 1)}
          />
        </div>
      )
    case 'order-history':
      return <OrderHistory key={`hist-${s.refreshKey}`} accountNo={s.accountNo} height="100%" todayOnly onSymbolSelect={s.setSymbol} />
    case 'holdings':
      return <Holdings key={`hold-${s.refreshKey}`} accountNo={s.accountNo} height="100%" showSummary={false} onSymbolSelect={s.setSymbol} />
    default:
      return null
  }
}
