'use client'
import { useQuery } from '@tanstack/react-query'
import { holdingApi, type HoldingsResponse } from './holding-api'
import { useAuthStore } from '@/store/auth-store'

// 주식잔고 조회 React Query 훅.
// 같은 queryKey(accountNo)로 호출하면 여러 컴포넌트의 동시 요청과
// StrictMode 이중 실행이 단일 네트워크 요청으로 dedupe된다.

/** 주식잔고(요약 + 보유종목) 조회. */
export function useHoldings(accountNo: string, options?: { enabled?: boolean }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery<HoldingsResponse>({
    queryKey: ['holding', accountNo],
    queryFn: async () => (await holdingApi.getHoldings(accountNo)).data,
    enabled: (options?.enabled ?? true) && !!accessToken && !!accountNo,
  })
}
