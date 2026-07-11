'use client'
import { useState } from 'react'
import { useStockPrice } from '@/features/quote/api/use-quote'
import { useStockPriceWS } from '@/features/quote/api/use-quote-ws'

/**
 * 위젯형 대시보드 비교 페이지(react-grid-layout/dockview/FlexLayout)들이 공유하는 상태.
 * 레이아웃 엔진만 다르고 비즈니스 로직(종목/계좌/가격 클릭 연동)은 동일해야 공정한 비교가 된다.
 */
export function useWidgetDashboardState() {
  const [symbol, setSymbol] = useState('005930')
  const [accountNo, setAccountNo] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  // 현재가/호가 위젯에서 가격을 클릭하면 주문폼 가격 인풋에 반영 (nonce로 동일값 재클릭도 감지)
  const [priceSignal, setPriceSignal] = useState<{ price: number; nonce: number } | null>(null)
  const handlePriceClick = (price: number) => setPriceSignal(prev => ({ price, nonce: (prev?.nonce ?? 0) + 1 }))

  // 주문폼에 필요한 현재가(REST 스냅샷 + WS 실시간)
  const { data: quoteSnapshot = null } = useStockPrice(symbol)
  const wsQuote = useStockPriceWS(symbol)
  const quote = wsQuote ?? quoteSnapshot

  return {
    symbol, setSymbol,
    accountNo, setAccountNo,
    refreshKey, setRefreshKey,
    priceSignal, handlePriceClick,
    quote,
  }
}

export type WidgetDashboardState = ReturnType<typeof useWidgetDashboardState>
