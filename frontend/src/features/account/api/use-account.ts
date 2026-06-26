'use client'
import { useQuery } from '@tanstack/react-query'
import {
  accountApi,
  type Account,
  type OrderableAmount,
  type OrderableShares,
} from './account-api'
import { useAuthStore } from '@/store/auth-store'

// 계좌 조회 React Query 훅.
// 같은 queryKey로 호출하면 여러 컴포넌트의 동시 요청과 StrictMode 이중 실행이
// 단일 네트워크 요청으로 dedupe된다. accessToken 가드는 enabled로 처리한다.

/** 계좌목록 조회. */
export function useAccounts(options?: { enabled?: boolean }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery<Account[]>({
    queryKey: ['account', 'list'],
    queryFn: async () => (await accountApi.getAccountList()).data,
    enabled: (options?.enabled ?? true) && !!accessToken,
  })
}

/** 주문가능금액 조회 (매수). */
export function useOrderableAmount(accountNo: string, options?: { enabled?: boolean }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery<OrderableAmount>({
    queryKey: ['account', 'orderable-amount', accountNo],
    queryFn: async () => (await accountApi.getOrderableAmount(accountNo)).data,
    enabled: (options?.enabled ?? true) && !!accessToken && !!accountNo,
  })
}

/** 주문가능수량 조회 (매도). */
export function useOrderableShares(accountNo: string, symbol: string, options?: { enabled?: boolean }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery<OrderableShares>({
    queryKey: ['account', 'orderable-shares', accountNo, symbol],
    queryFn: async () => (await accountApi.getOrderableShares(accountNo, symbol)).data,
    enabled: (options?.enabled ?? true) && !!accessToken && !!accountNo && !!symbol,
  })
}
