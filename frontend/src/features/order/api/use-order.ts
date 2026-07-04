'use client'
import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  orderApi,
  type OrderHistoryParams,
  type OrderHistoryResponse,
} from './order-api'
import { useAuthStore } from '@/store/auth-store'
import { useAccountActivityWS } from '@/features/quote/api/use-quote-ws'

// 주문내역 조회 + 주문 변경(매수/매도/정정/취소) React Query 훅.
// 같은 queryKey(조건)로 조회하면 여러 컴포넌트의 동시 요청과 StrictMode
// 이중 실행이 단일 네트워크 요청으로 dedupe된다.
// 주문 변경 mutation은 onSuccess에서 주문내역/잔고 캐시를 무효화한다.

/** 주문내역 조회. */
export function useOrderHistory(params: OrderHistoryParams, options?: { enabled?: boolean }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery<OrderHistoryResponse>({
    queryKey: [
      'order',
      'history',
      params.accountNo,
      params.side ?? 'ALL',
      params.fill ?? 'ALL',
      params.symbol ?? '',
      params.startDate ?? '',
      params.endDate ?? '',
    ],
    queryFn: async () => (await orderApi.getHistory(params)).data,
    enabled: (options?.enabled ?? true) && !!accessToken && !!params.accountNo,
  })
}

/** 주문 변경 후 주문내역·잔고 캐시 무효화. */
function useInvalidateOrders() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['order', 'history'] })
    queryClient.invalidateQueries({ queryKey: ['holding'] })
  }
}

/**
 * 계좌 활동 실시간 동기화 — 서버에서 주문이 접수·정정·취소·체결(지정가 자동체결 포함)될 때마다
 * WS 신호를 받아 주문내역·보유종목을 자동 재조회한다. OrderHistory/Holdings 양쪽에서 사용.
 */
export function useAccountActivitySync(accountNo: string) {
  const activity = useAccountActivityWS(accountNo)
  const invalidate = useInvalidateOrders()
  useEffect(() => {
    if (activity) invalidate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity])
}

/** 매수 주문. */
export function useBuyOrder() {
  const invalidate = useInvalidateOrders()
  return useMutation({
    mutationFn: orderApi.buy,
    onSuccess: () => invalidate(),
  })
}

/** 매도 주문. */
export function useSellOrder() {
  const invalidate = useInvalidateOrders()
  return useMutation({
    mutationFn: orderApi.sell,
    onSuccess: () => invalidate(),
  })
}

/** 정정 주문. */
export function useAmendOrder() {
  const invalidate = useInvalidateOrders()
  return useMutation({
    mutationFn: orderApi.amend,
    onSuccess: () => invalidate(),
  })
}

/** 취소 주문. */
export function useCancelOrder() {
  const invalidate = useInvalidateOrders()
  return useMutation({
    mutationFn: orderApi.cancel,
    onSuccess: () => invalidate(),
  })
}
