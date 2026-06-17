import type { Metadata } from 'next'

interface TradePageProps {
  params: Promise<{ symbol: string }>
}

export async function generateMetadata({ params }: TradePageProps): Promise<Metadata> {
  const { symbol } = await params
  return {
    title: `${symbol.toUpperCase()} 트레이딩`,
    description: `${symbol.toUpperCase()} 실시간 차트 및 주문`,
  }
}

/**
 * 트레이딩 뷰 페이지
 *
 * 아키텍처 설계:
 * - 이 페이지는 CSR(Client-Side Rendering) 위주로 구성
 * - 실시간 가격/호가/체결 데이터는 STOMP/WebSocket으로 수신
 * - 차트, 호가창, 주문창은 모두 Client Component
 * - SSR로 종목 기본 정보(이름, 업종 등)만 서버에서 fetch 가능
 *
 * 컴포넌트 구조 (구현 예정):
 * ┌─────────────────────────────────────────┐
 * │  TradeHeader (종목명, 현재가, 등락률)      │
 * ├──────────────────────┬──────────────────┤
 * │                      │  OrderBook       │
 * │  CandleChart         │  (호가창)         │
 * │  (실시간 캔들차트)     ├──────────────────┤
 * │                      │  OrderForm       │
 * │                      │  (매수/매도 주문)  │
 * ├──────────────────────┴──────────────────┤
 * │  RecentTrades (실시간 체결 내역)           │
 * └─────────────────────────────────────────┘
 *
 * WebSocket 구독 경로:
 * - /topic/price/{symbol}     : 실시간 현재가
 * - /topic/orderbook/{symbol} : 실시간 호가
 * - /topic/trades/{symbol}    : 실시간 체결
 */

// TODO: 아래 컴포넌트들 구현 후 import
// import { TradeHeader } from '@/features/trading/ui/TradeHeader'
// import { CandleChart } from '@/features/trading/ui/CandleChart'
// import { OrderBook } from '@/features/trading/ui/OrderBook'
// import { OrderForm } from '@/features/trading/ui/OrderForm'
// import { RecentTrades } from '@/features/trading/ui/RecentTrades'

export default async function TradePage({ params }: TradePageProps) {
  const { symbol } = await params
  const upperSymbol = symbol.toUpperCase()

  return (
    <div className="h-full flex flex-col gap-4">
      {/* 종목 헤더 */}
      {/* TODO: <TradeHeader symbol={upperSymbol} /> */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{upperSymbol}</h1>
            <p className="text-sm text-muted-foreground">종목 정보 로딩 중...</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold font-numeric text-foreground">--</p>
            <p className="text-sm text-muted-foreground">전일 대비: --</p>
          </div>
        </div>
      </div>

      {/* 메인 트레이딩 영역 */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* 차트 영역 */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg flex flex-col">
          <div className="p-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">차트</h2>
          </div>
          {/* TODO: <CandleChart symbol={upperSymbol} /> */}
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8">
            실시간 캔들 차트가 여기에 표시됩니다.
            <br />
            WebSocket: /topic/price/{upperSymbol}
          </div>
        </div>

        {/* 호가창 + 주문창 */}
        <div className="flex flex-col gap-4">
          {/* 호가창 */}
          <div className="bg-card border border-border rounded-lg flex flex-col">
            <div className="p-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">호가</h2>
            </div>
            {/* TODO: <OrderBook symbol={upperSymbol} /> */}
            <div className="p-4 text-center text-muted-foreground text-xs">
              호가 데이터 로딩 중...
            </div>
          </div>

          {/* 주문창 */}
          <div className="bg-card border border-border rounded-lg">
            <div className="p-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">주문</h2>
            </div>
            {/* TODO: <OrderForm symbol={upperSymbol} /> */}
            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <button className="flex-1 py-2 text-sm font-medium bg-profit text-white rounded-md hover:opacity-90 transition-opacity">
                  매수
                </button>
                <button className="flex-1 py-2 text-sm font-medium bg-loss text-white rounded-md hover:opacity-90 transition-opacity">
                  매도
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                주문 폼 구현 예정
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 실시간 체결 내역 */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">실시간 체결</h2>
        </div>
        {/* TODO: <RecentTrades symbol={upperSymbol} /> */}
        <div className="p-4 text-center text-muted-foreground text-xs">
          실시간 체결 내역이 여기에 표시됩니다. WebSocket: /topic/trades/{upperSymbol}
        </div>
      </div>
    </div>
  )
}
