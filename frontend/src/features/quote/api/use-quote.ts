'use client'
import { useQuery } from '@tanstack/react-query'
import { quoteApi, type QuotePriceResponse, type HogaData, type QuoteDetailItem, type DailyChartType } from './quote-api'

// 시세 조회 React Query 훅.
// 같은 queryKey(symbol)로 호출하면 여러 컴포넌트의 동시 요청과 StrictMode 이중 실행이
// 단일 네트워크 요청으로 dedupe된다.

/** 현재가 조회. quote를 직접 주입한 제어형 컴포넌트는 enabled:false로 끈다. */
export function useStockPrice(symbol: string, options?: { enabled?: boolean }) {
  return useQuery<QuotePriceResponse>({
    queryKey: ['quote', 'price', symbol],
    queryFn: async () => (await quoteApi.getPrice(symbol)).data,
    enabled: (options?.enabled ?? true) && !!symbol,
  })
}

/** 호가 조회. */
export function useHoga(symbol: string, options?: { enabled?: boolean }) {
  return useQuery<HogaData>({
    queryKey: ['quote', 'hoga', symbol],
    queryFn: async () => (await quoteApi.getHoga(symbol)).data,
    enabled: (options?.enabled ?? true) && !!symbol,
  })
}

/** 종목 상세(시가총액/PER 등) 조회. */
export function useStockDetail(symbol: string, options?: { enabled?: boolean }) {
  return useQuery<QuoteDetailItem>({
    queryKey: ['quote', 'detail', symbol],
    queryFn: async () => (await quoteApi.getDetail(symbol)).data,
    enabled: (options?.enabled ?? true) && !!symbol,
  })
}

/** 일봉 차트 단건 조회(무한스크롤 없이 size개). */
export function useDailyChart(
  symbol: string,
  type: DailyChartType = 'D',
  size = 120,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['quote', 'chart-daily', symbol, type, size],
    queryFn: async () => (await quoteApi.getChartDaily(symbol, type, size)).data,
    enabled: (options?.enabled ?? true) && !!symbol,
  })
}
