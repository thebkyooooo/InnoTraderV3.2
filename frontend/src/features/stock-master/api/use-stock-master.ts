'use client'
import { useQuery } from '@tanstack/react-query'
import { stockMasterApi, type StockQuote } from './stock-master-api'

// 복수종목 시세 조회 React Query 훅.
// 같은 queryKey(symbols)로 호출하면 여러 컴포넌트의 동시 요청과
// StrictMode 이중 실행이 단일 네트워크 요청으로 dedupe된다.

/** 복수종목 시세 조회. symbols가 비어있으면 호출하지 않는다. */
export function useStockQuotes(symbols: string[], options?: { enabled?: boolean }) {
  return useQuery<StockQuote[]>({
    queryKey: ['stock', 'batch', symbols.join(',')],
    queryFn: async () => (await stockMasterApi.getBatch(symbols)).data,
    enabled: (options?.enabled ?? true) && symbols.length > 0,
  })
}
