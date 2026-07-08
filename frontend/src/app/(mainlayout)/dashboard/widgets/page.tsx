'use client'
import React, { useState, useEffect, useCallback } from 'react'
import GridLayout, { WidthProvider, type Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { RestartAlt } from '@mui/icons-material'
import { StockDetailCard, QuoteBoard, AnalysisChart, OrderBook, DailyQuoteGrid, FilledQuoteGrid, InvestmentTrendGrid } from '@/components/quote'
import { AccountSelect, Holdings } from '@/components/account'
import { OrderForm, OrderHistory } from '@/components/order'
import { Tabs } from '@/components/ui'
import { useStockPrice } from '@/features/quote/api/use-quote'
import { useStockPriceWS } from '@/features/quote/api/use-quote-ws'

const ReactGridLayout = WidthProvider(GridLayout)

const ROW_HEIGHT = 30
const STORAGE_KEY = 'dashboard-widgets-layout-v3'

const WIDGET_TITLES: Record<string, string> = {
  'quote-board': '현재가',
  'analysis-chart': '분석차트',
  'stock-detail': '종목상세',
  'order-form': '주문',
  'order-history': '주문내역',
  'holdings': '보유주식',
}

/** 타이틀 자리에 고정 텍스트 대신 탭을 보여줄 위젯. 값은 renderWidgetBody의 case와 대응. */
const WIDGET_TABS: Record<string, { value: string; label: string }[]> = {
  'filled-daily-trend': [
    { value: 'filled', label: '체결' },
    { value: 'daily', label: '일별' },
    { value: 'trend', label: '투자동향' },
  ],
  'orderbook': [
    { value: 'dom', label: '호가 Dom' },
    { value: 'canvas', label: '호가 Canvas' },
  ],
}

const DEFAULT_LAYOUT: Layout[] = [
  { i: 'quote-board',        x: 0, y: 0,  w: 8, h: 5,  minW: 2, minH: 4 },
  { i: 'orderbook',          x: 0, y: 5, w: 8,  h: 14, minW: 2, minH: 4 },
  { i: 'analysis-chart',     x: 0, y: 19,  w: 8,  h: 12, minW: 2, minH: 4 },
  { i: 'filled-daily-trend', x: 0, y: 31,  w: 8,  h: 6, minW: 2, minH: 4 },
  { i: 'order-form',         x: 9, y: 0, w: 4,  h: 12, minW: 2, minH: 4 },
  { i: 'order-history',      x: 9, y: 12, w: 4,  h: 6, minW: 2, minH: 4 },
  { i: 'holdings',           x: 9, y: 18, w: 4,  h: 10, minW: 2, minH: 4 },
  { i: 'stock-detail',       x: 9, y: 28,  w: 4,  h: 9, minW: 2, minH: 4 },  
]

export default function DashboardWidgetsPage() {
  const [symbol, setSymbol] = useState('005930')
  const [layout, setLayout] = useState<Layout[]>(DEFAULT_LAYOUT)
  const [tabValue, setTabValue] = useState('filled')
  const [hogaTabValue, setHogaTabValue] = useState('dom')
  // 위젯 id → 그 위젯의 탭 state/setter. WIDGET_TABS에 항목을 추가할 때 여기도 함께 등록해야 한다.
  const tabState: Record<string, { value: string; onChange: (v: string) => void }> = {
    'filled-daily-trend': { value: tabValue, onChange: setTabValue },
    'orderbook': { value: hogaTabValue, onChange: setHogaTabValue },
  }

  // ── 주문폼 연동 상태 (order/order 화면과 동일한 패턴) ──────────────────────────
  const [accountNo, setAccountNo] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  // 현재가/호가 위젯에서 가격을 클릭하면 주문폼 가격 인풋에 반영 (nonce로 동일값 재클릭도 감지)
  const [priceSignal, setPriceSignal] = useState<{ price: number; nonce: number } | null>(null)
  const handlePriceClick = (price: number) => setPriceSignal(prev => ({ price, nonce: (prev?.nonce ?? 0) + 1 }))

  // 주문폼에 필요한 현재가(REST 스냅샷 + WS 실시간)
  const { data: quoteSnapshot = null } = useStockPrice(symbol)
  const wsQuote = useStockPriceWS(symbol)
  const quote = wsQuote ?? quoteSnapshot

  // localStorage에 저장된 레이아웃 복원 (SSR에는 localStorage가 없어 마운트 후에만 시도)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setLayout(JSON.parse(saved))
    } catch {
      // 손상된 값이면 기본 레이아웃 유지
    }
  }, [])

  const handleLayoutChange = useCallback((next: Layout[]) => {
    setLayout(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // storage 사용 불가 환경이면 조용히 무시 (레이아웃은 메모리상으로만 유지)
    }
  }, [])

  const resetLayout = () => {
    setLayout(DEFAULT_LAYOUT)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  // ── 위젯 id → 콘텐츠 (quote/price 화면과 동일한 컴포넌트 재사용, symbol만 공유) ──
  function renderWidgetBody(id: string): React.ReactNode {
    switch (id) {
      case 'quote-board':
        return <QuoteBoard symbol={symbol} onStockSelect={stock => setSymbol(stock.symbol)} onPriceClick={handlePriceClick} />
      case 'analysis-chart':
        return (
          <div className='w-full h-full'>
            <AnalysisChart symbol={symbol} />
          </div>
        )
      case 'filled-daily-trend':
        // 체결 / 일별 / 투자동향 — 탭 전환(탭 자체는 위젯 타이틀 바에서 렌더링, WIDGET_TABS 참고)
        return (
          <div className='w-full h-full'>
            {tabValue === 'filled' && <FilledQuoteGrid symbol={symbol} />}
            {tabValue === 'daily'  && <DailyQuoteGrid symbol={symbol} />}
            {tabValue === 'trend'  && <InvestmentTrendGrid symbol={symbol} />}
          </div>
        )
      case 'stock-detail':
        return <StockDetailCard symbol={symbol} />
      case 'orderbook':
        // 호가 Dom / Canvas — 탭 전환(탭 자체는 위젯 타이틀 바에서 렌더링, WIDGET_TABS 참고)
        return (
          <div className='w-full h-full'>
            {hogaTabValue === 'dom' && <OrderBook symbol={symbol} variant="dom" onPriceClick={handlePriceClick} />}
            {hogaTabValue === 'canvas' && <OrderBook symbol={symbol} variant="canvas" onPriceClick={handlePriceClick} />}
          </div>
        )
      case 'order-form':
        return (
          <div className='flex flex-col gap-3 h-full overflow-auto pt-2'>
            <AccountSelect value={accountNo} onChange={setAccountNo} label="계좌 선택" placeholder="계좌번호를 선택하세요" size="small" />
            <OrderForm
              accountNo={accountNo}
              symbol={symbol}
              name={quote?.name ?? ''}
              currentPrice={quote?.price}
              priceSignal={priceSignal}
              onOrdered={() => setRefreshKey(k => k + 1)}
            />
          </div>
        )
      case 'order-history':
        return <OrderHistory key={`hist-${refreshKey}`} accountNo={accountNo} height="100%" todayOnly onSymbolSelect={setSymbol} />
      case 'holdings':
        return <Holdings key={`hold-${refreshKey}`} accountNo={accountNo} height="100%" showSummary={false} onSymbolSelect={setSymbol} />
      default:
        return null
    }
  }

  return (
    <div className='relative flex flex-col gap-3 w-full h-full'>
      {/* fixed — main 콘텐츠 영역 스크롤과 무관하게 뷰포트 기준으로 항상 같은 자리에 떠 있는다 */}
      <button
        type='button'
        onClick={resetLayout}
        className='fixed top-[66px] right-[12px] z-30 flex flex-col items-center gap-1 px-1 py-1 text-xs text-gray-500 bg-white border border-gray-200 rounded-full shadow-md hover:text-blue-700 hover:border-blue-200'
        title='위젯 레이아웃 초기화'
      >
        <RestartAlt sx={{ fontSize: 28 }} />
      </button>

      <ReactGridLayout
        className='layout'
        layout={layout}
        cols={12}
        rowHeight={ROW_HEIGHT}
        onLayoutChange={handleLayoutChange}
        draggableHandle='.widget-drag-handle'
        compactType='vertical'
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {layout.map((item) => (
          <div key={item.i} className='bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden p-4'>
            <div className='widget-drag-handle flex items-center -mb-1 border-b-0 border-gray-200 text-sm font-semibold text-gray-500 cursor-move select-none'>
              {WIDGET_TABS[item.i] ? (
                // 탭 클릭이 드래그 시작으로 오인되지 않도록 이 영역에서 mousedown 전파를 막는다.
                <div onMouseDown={(e) => e.stopPropagation()} className='cursor-auto mb-1'>
                  <Tabs
                    value={tabState[item.i].value}
                    onChange={(v) => tabState[item.i].onChange(String(v))}
                    tabs={WIDGET_TABS[item.i]}
                  />
                </div>
              ) : (
                <div className='pb-3.5'>
                  {WIDGET_TITLES[item.i] ?? item.i}
                </div>
              )}
            </div>
            <div className='flex-1 min-h-0 overflow-auto'>
              {renderWidgetBody(item.i)}
            </div>
          </div>
        ))}
      </ReactGridLayout>
    </div>
  )
}
