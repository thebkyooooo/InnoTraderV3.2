'use client'
import { useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useWidgetVisible } from '@/shared/lib/widget-visibility'

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
  // 위젯이 숨겨져 있으면 조회하지 않는다. 다시 보이면 staleTime:0라 자동 재조회된다.
  const widgetVisible = useWidgetVisible()

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchFn(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.data.hasNext ? last.data.nextCursor ?? undefined : undefined),
    enabled: widgetVisible,
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
