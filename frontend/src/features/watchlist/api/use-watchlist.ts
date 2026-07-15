'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  watchlistApi,
  type WatchlistGroup,
  type WatchlistGroupDetail,
} from './watchlist-api'
import { useAuthStore } from '@/store/auth-store'

// 관심그룹/관심종목 조회 + 변경(그룹·종목 CRUD) React Query 훅.
// 같은 queryKey로 조회하면 여러 컴포넌트의 동시 요청과 StrictMode
// 이중 실행이 단일 네트워크 요청으로 dedupe된다.
// 변경 mutation은 onSuccess에서 그룹/해당 그룹 종목 캐시를 무효화한다.

/** 관심그룹 목록 조회. */
export function useWatchlistGroups(options?: { enabled?: boolean }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery<WatchlistGroup[]>({
    queryKey: ['watchlist', 'groups'],
    queryFn: async () => (await watchlistApi.listGroups()).data,
    enabled: (options?.enabled ?? true) && !!accessToken,
  })
}

/** 관심그룹의 관심종목 조회. */
export function useWatchlistItems(groupCode: string, options?: { enabled?: boolean }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery<WatchlistGroupDetail>({
    queryKey: ['watchlist', 'items', groupCode],
    queryFn: async () => (await watchlistApi.getItems(groupCode)).data,
    enabled: (options?.enabled ?? true) && !!accessToken && !!groupCode,
  })
}

/** 관심그룹 등록. */
export function useCreateWatchlistGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (groupName: string) => watchlistApi.createGroup(groupName),
    // 응답이 갱신된 그룹 목록 전체를 담고 있으므로 재조회를 기다리지 않고 캐시를 바로 갱신한다.
    // invalidateQueries만 쓰면 재조회가 끝나기 전까지 groups가 이전 목록을 유지해
    // 방금 생성된 그룹코드로 selectedCode를 옮기는 순간 Select가 out-of-range 값을 갖게 된다.
    onSuccess: (res) => {
      queryClient.setQueryData(['watchlist', 'groups'], res.data)
    },
  })
}

/** 관심그룹 변경(그룹명). */
export function useRenameWatchlistGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ groupCode, groupName }: { groupCode: string; groupName: string }) =>
      watchlistApi.renameGroup(groupCode, groupName),
    onSuccess: (res) => {
      queryClient.setQueryData(['watchlist', 'groups'], res.data)
    },
  })
}

/** 관심그룹 삭제. */
export function useDeleteWatchlistGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (groupCode: string) => watchlistApi.deleteGroup(groupCode),
    onSuccess: (res) => {
      queryClient.setQueryData(['watchlist', 'groups'], res.data)
    },
  })
}

/** 관심종목 추가 (복수). */
export function useAddWatchlistItems() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ groupCode, symbols }: { groupCode: string; symbols: string[] }) =>
      watchlistApi.addItems(groupCode, symbols),
    onSuccess: (res, { groupCode }) => {
      queryClient.setQueryData(['watchlist', 'items', groupCode], res.data)
      // 그룹 목록의 itemCount도 함께 바뀌므로 재조회한다(응답에 그룹 목록 전체는 없음).
      queryClient.invalidateQueries({ queryKey: ['watchlist', 'groups'] })
    },
  })
}

/** 관심종목 삭제 (복수). */
export function useRemoveWatchlistItems() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ groupCode, symbols }: { groupCode: string; symbols: string[] }) =>
      watchlistApi.removeItems(groupCode, symbols),
    onSuccess: (res, { groupCode }) => {
      queryClient.setQueryData(['watchlist', 'items', groupCode], res.data)
      queryClient.invalidateQueries({ queryKey: ['watchlist', 'groups'] })
    },
  })
}
