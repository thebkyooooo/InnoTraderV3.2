'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Responsive, WidthProvider, type Layout, type Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { RestartAlt, DragIndicator } from '@mui/icons-material'
import { StockDetailCard, QuoteBoard, AnalysisChart, OrderBook, DailyQuoteGrid, FilledQuoteGrid, InvestmentTrendGrid } from '@/components/quote'
import { AccountSelect, Holdings } from '@/components/account'
import { OrderForm, OrderHistory } from '@/components/order'
import { Tabs } from '@/components/ui'
import { useStockPrice } from '@/features/quote/api/use-quote'
import { useStockPriceWS } from '@/features/quote/api/use-quote-ws'

const ResponsiveGridLayout = WidthProvider(Responsive)

const ROW_HEIGHT = 30
const STORAGE_KEY = 'dashboard-widgets-layout-v5'

// 해상도별 브레이크포인트(px)·컬럼 수 — lg: 데스크톱, md: 태블릿, sm: 그 이하(모바일 포함).
// react-grid-layout의 breakpoints는 뷰포트가 아니라 (WidthProvider가 측정하는) 그리드
// 컨테이너 실제 폭 기준이다. 이 화면은 사이드바+여백으로 뷰포트 대비 컨테이너가 항상
// 약 295px 좁게 측정되므로(예: 1440px 뷰포트 → 컨테이너 1145px), 그 오프셋을 감안해 잡았다.
const BREAKPOINTS = { xl: 2000, lg: 1600, md: 1000, sm: 600, xs: 0 }
const COLS = { xl: 21, lg: 15, md: 9, sm: 5, xs: 2 }

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

/** 모든 브레이크포인트에 공통으로 존재하는 위젯 id 목록(렌더링용) — 배치는 브레이크포인트별로 다르다. */
const WIDGET_IDS = [
  'quote-board', 'orderbook', 'analysis-chart', 'filled-daily-trend',
  'order-form', 'order-history', 'holdings', 'stock-detail',
] as const

const DEFAULT_LAYOUTS: Layouts = {
  // xl (데스크톱, cols 18) — 4단 비율
  xl: [
    { i: 'quote-board',        x: 0, y: 0,  w: 12, h: 5,  minW: 2, minH: 4 },
    { i: 'analysis-chart',     x: 0, y: 5, w: 12, h: 18, minW: 2, minH: 4 },
    { i: 'filled-daily-trend', x: 0, y: 23, w: 12, h: 8,  minW: 2, minH: 4 },
    { i: 'orderbook',          x: 12, y: 5,  w: 3, h: 14, minW: 2, minH: 4 },
    { i: 'stock-detail',       x: 12, y: 19, w: 3, h: 9,  minW: 2, minH: 4 },
    { i: 'order-form',         x: 15, y: 0,  w: 3, h: 12, minW: 2, minH: 4 },
    { i: 'order-history',      x: 15, y: 12, w: 3, h: 8,  minW: 2, minH: 4 },
    { i: 'holdings',           x: 18, y: 20, w: 3, h: 20, minW: 2, minH: 4 },
  ],
  // lg (데스크톱, cols 15) — 4단 비율
  lg: [
    { i: 'quote-board',        x: 0, y: 0,  w: 6, h: 5,  minW: 2, minH: 4 },
    { i: 'analysis-chart',     x: 0, y: 5, w: 6, h: 18, minW: 2, minH: 4 },
    { i: 'filled-daily-trend', x: 0, y: 23, w: 6, h: 8,  minW: 2, minH: 4 },
    { i: 'orderbook',          x: 6, y: 5,  w: 3, h: 14, minW: 2, minH: 4 },
    { i: 'stock-detail',       x: 6, y: 19, w: 3, h: 9,  minW: 2, minH: 4 },
    { i: 'order-form',         x: 9, y: 0,  w: 3, h: 12, minW: 2, minH: 4 },
    { i: 'order-history',      x: 9, y: 12, w: 3, h: 8,  minW: 2, minH: 4 },
    { i: 'holdings',           x: 12, y: 20, w: 3, h: 20, minW: 2, minH: 4 },
  ],
  // md (태블릿, cols 9) — 3단 비율은 lg와 동일하게 유지, 폭만 축소.
  md: [
    { i: 'quote-board',        x: 0, y: 0,  w: 3, h: 5,  minW: 2, minH: 4 },
    { i: 'analysis-chart',     x: 0, y: 5, w: 3, h: 12, minW: 2, minH: 4 },
    { i: 'filled-daily-trend', x: 0, y: 17, w: 3, h: 8,  minW: 2, minH: 4 },
    { i: 'orderbook',          x: 3, y: 5,  w: 3, h: 14, minW: 2, minH: 4 },
    { i: 'stock-detail',       x: 3, y: 19, w: 3, h: 9,  minW: 2, minH: 4 },
    { i: 'order-form',         x: 6, y: 0,  w: 3, h: 12, minW: 2, minH: 4 },
    { i: 'order-history',      x: 6, y: 12, w: 3, h: 8,  minW: 2, minH: 4 },
    { i: 'holdings',           x: 6, y: 20, w: 3, h: 8, minW: 2, minH: 4 },
  ],
  // sm (모바일 포함, cols 5) —  좌/우 2단 비율은 lg와 동일하게 유지, 폭만 축소.
  sm: [
    { i: 'quote-board',        x: 0, y: 0,  w: 3, h: 5,  minW: 2, minH: 4 },
    { i: 'orderbook',          x: 0, y: 5,  w: 3, h: 14, minW: 2, minH: 4 },
    { i: 'analysis-chart',     x: 0, y: 19, w: 3, h: 12, minW: 2, minH: 4 },
    { i: 'filled-daily-trend', x: 0, y: 31, w: 3, h: 8,  minW: 2, minH: 4 },
    { i: 'order-form',         x: 3, y: 0,  w: 2, h: 12, minW: 2, minH: 4 },
    { i: 'order-history',      x: 3, y: 12, w: 2, h: 8,  minW: 2, minH: 4 },
    { i: 'holdings',           x: 3, y: 20, w: 2, h: 10, minW: 2, minH: 4 },
    { i: 'stock-detail',       x: 3, y: 30, w: 2, h: 9,  minW: 2, minH: 4 },
  ],
  // xs (모바일 포함, cols 2) — 전부 단일 컬럼 전체폭으로 세로 스택, 우선순위 순.
  xs: [
    { i: 'quote-board',        x: 0, y: 0,  w: 2, h: 5,  minW: 2, minH: 4 },
    { i: 'order-form',         x: 0, y: 5,  w: 2, h: 12, minW: 2, minH: 4 },
    { i: 'orderbook',          x: 0, y: 17, w: 2, h: 14, minW: 2, minH: 4 },
    { i: 'analysis-chart',     x: 0, y: 31, w: 2, h: 12, minW: 2, minH: 4 },
    { i: 'order-history',      x: 0, y: 43, w: 2, h: 8,  minW: 2, minH: 4 },
    { i: 'holdings',           x: 0, y: 51, w: 2, h: 10, minW: 2, minH: 4 },
    { i: 'filled-daily-trend', x: 0, y: 61, w: 2, h: 6,  minW: 2, minH: 4 },
    { i: 'stock-detail',       x: 0, y: 67, w: 2, h: 9,  minW: 2, minH: 4 },
  ],
}

export default function DashboardWidgetsPage() {
  const [symbol, setSymbol] = useState('005930')
  const [layouts, setLayouts] = useState<Layouts>(DEFAULT_LAYOUTS)
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
      if (saved) setLayouts(JSON.parse(saved))
    } catch {
      // 손상된 값이면 기본 레이아웃 유지
    }
  }, [])

  // Responsive 그리드는 (현재 브레이크포인트의 layout, 전체 브레이크포인트 layouts)를 함께 넘겨준다.
  const handleLayoutChange = useCallback((_current: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allLayouts))
    } catch {
      // storage 사용 불가 환경이면 조용히 무시 (레이아웃은 메모리상으로만 유지)
    }
  }, [])

  const resetLayout = () => {
    setLayouts(DEFAULT_LAYOUTS)
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
        className='h-[42px]  w-[42px] fixed top-[66px] right-[12px] z-30 flex flex-col items-center gap-1 px-0 py-[1px] text-gray-500 bg-white border border-gray-200 rounded-full shadow-md hover:text-blue-700 hover:border-blue-200'
        title='위젯 레이아웃 초기화'
      >
        <RestartAlt sx={{ fontSize: 38 }} />
        <span className='text-[7px] -mt-[24px]'>리셋</span>
      </button>

      <ResponsiveGridLayout
        className='layout'
        layouts={layouts}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        rowHeight={ROW_HEIGHT}
        onLayoutChange={handleLayoutChange}
        draggableHandle='.widget-drag-handle'
        compactType='vertical'
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {WIDGET_IDS.map((id) => (
          <div key={id} className='bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden p-4'>
            <div className='widget-drag-handle flex items-start -mb-1 border-b-0 border-gray-200 text-sm font-semibold text-gray-500 cursor-move select-none'>
              {WIDGET_TABS[id] ? (
                // 탭 클릭이 드래그 시작으로 오인되지 않도록 이 영역에서 mousedown 전파를 막는다.
                <div onMouseDown={(e) => e.stopPropagation()} className='cursor-auto mb-1'>
                  <Tabs
                    value={tabState[id].value}
                    onChange={(v) => tabState[id].onChange(String(v))}
                    tabs={WIDGET_TABS[id]}
                  />
                </div>
              ) : (
                <div className='pb-3.5'>
                  {WIDGET_TITLES[id] ?? id}
                </div>
              )}
              <DragIndicator sx={{ fontSize: 22, ml: 'auto', mr: '-2px', mt: '-2px', color: 'text.disabled' }} />
            </div>
            <div className='flex-1 min-h-0 overflow-auto'>
              {renderWidgetBody(id)}
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  )
}
