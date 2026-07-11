'use client'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { quoteApi, type QuotePriceResponse, type HogaData, type QuoteDetailItem, type DailyChartType } from './quote-api'
import { useWidgetVisible } from '@/shared/lib/widget-visibility'

// 시세 조회 React Query 훅.
// 같은 queryKey(symbol)로 호출하면 여러 컴포넌트의 동시 요청과 StrictMode 이중 실행이
// 단일 네트워크 요청으로 dedupe된다.
// 위젯 안에서 호출되면 숨김 시 비활성(useWidgetVisible)되고, 위젯 밖에서는 항상 활성.

/** 현재가 조회. quote를 직접 주입한 제어형 컴포넌트는 enabled:false로 끈다. */
export function useStockPrice(symbol: string, options?: { enabled?: boolean }) {
  const widgetVisible = useWidgetVisible()
  return useQuery<QuotePriceResponse>({
    queryKey: ['quote', 'price', symbol],
    queryFn: async () => (await quoteApi.getPrice(symbol)).data,
    enabled: (options?.enabled ?? true) && !!symbol && widgetVisible,
    // 종목 전환 시 새 데이터가 올 때까지 이전 종목 데이터를 유지 — 화면이 순간 비어
    // 레이아웃이 줄었다 늘어나며 스크롤 위치가 clamp되는 것을 방지 (처음 조회하는
    // 종목에서만 발생: 캐시가 있는 종목은 로딩 중에도 기존 데이터가 즉시 표시됨)
    placeholderData: keepPreviousData,
  })
}

/** 호가 조회. */
export function useHoga(symbol: string, options?: { enabled?: boolean }) {
  const widgetVisible = useWidgetVisible()
  return useQuery<HogaData>({
    queryKey: ['quote', 'hoga', symbol],
    queryFn: async () => (await quoteApi.getHoga(symbol)).data,
    enabled: (options?.enabled ?? true) && !!symbol && widgetVisible,
    // 종목 전환 시 "불러오는 중" 문구로 축소됐다 복원되며 스크롤이 튀는 것 방지
    placeholderData: keepPreviousData,
  })
}

/** 종목 상세(시가총액/PER 등) 조회. */
export function useStockDetail(symbol: string, options?: { enabled?: boolean }) {
  const widgetVisible = useWidgetVisible()
  return useQuery<QuoteDetailItem>({
    queryKey: ['quote', 'detail', symbol],
    queryFn: async () => (await quoteApi.getDetail(symbol)).data,
    enabled: (options?.enabled ?? true) && !!symbol && widgetVisible,
  })
}

/** 일봉 차트 단건 조회(무한스크롤 없이 size개). */
export function useDailyChart(
  symbol: string,
  type: DailyChartType = 'D',
  size = 120,
  options?: { enabled?: boolean },
) {
  const widgetVisible = useWidgetVisible()
  return useQuery({
    queryKey: ['quote', 'chart-daily', symbol, type, size],
    queryFn: async () => (await quoteApi.getChartDaily(symbol, type, size)).data,
    enabled: (options?.enabled ?? true) && !!symbol && widgetVisible,
  })
}
