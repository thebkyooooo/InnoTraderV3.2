'use client'
import { useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'

interface Page<T> {
  items: T[]
  nextCursor: string | null
  hasNext: boolean
}

type FetchFn<T> = (cursor?: string) => Promise<{ data: Page<T> }>

export interface ScrollPageResult<T> {
  items: T[]
  loading: boolean
  hasNext: boolean
  sentinelRef: React.RefObject<HTMLDivElement | null>
  loadMore: () => void
}

/**
 * 커서 기반 무한스크롤 조회 훅 (React Query useInfiniteQuery).
 * 같은 queryKey면 동시/중복 요청과 StrictMode 이중 실행이 dedupe되고,
 * 화면 재진입 시 캐시를 재사용한다.
 */
export function useScrollPage<T>(
  fetchFn: FetchFn<T>,
  queryKey: readonly unknown[],
): ScrollPageResult<T> {
  const sentinelRef = useRef<HTMLDivElement>(null)

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchFn(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.data.hasNext ? last.data.nextCursor ?? undefined : undefined),
  })

  const items = query.data?.pages.flatMap((p) => p.data.items) ?? []

  const loadMore = () => {
    if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage()
  }

  return {
    items,
    loading: query.isFetching,
    hasNext: !!query.hasNextPage,
    sentinelRef,
    loadMore,
  }
}
