import { useState, useEffect, useRef, useCallback } from 'react'

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

export function useScrollPage<T>(fetchFn: FetchFn<T>): ScrollPageResult<T> {
  const [items, setItems]     = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [hasNext, setHasNext] = useState(false)

  const cursorRef  = useRef<string | null>(null)
  const hasNextRef = useRef(false)
  const loadingRef = useRef(false)
  const versionRef = useRef(0)
  const initedRef  = useRef<FetchFn<T> | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async (reset: boolean) => {
    if (!reset && loadingRef.current) return
    if (!reset && !hasNextRef.current) return

    if (reset) {
      cursorRef.current  = null
      hasNextRef.current = false
      loadingRef.current = false
    }

    const ver = reset ? ++versionRef.current : versionRef.current
    loadingRef.current = true
    setLoading(true)
    if (reset) {
      setItems([])
      setHasNext(false)
    }

    try {
      const cursor = reset ? undefined : (cursorRef.current ?? undefined)
      const res = await fetchFn(cursor)
      if (ver !== versionRef.current) return

      const page = res.data
      setItems(prev => reset ? page.items : [...prev, ...page.items])
      cursorRef.current  = page.nextCursor
      hasNextRef.current = page.hasNext
      setHasNext(page.hasNext)
    } catch {
      // silent
    } finally {
      if (ver === versionRef.current) {
        loadingRef.current = false
        setLoading(false)
      }
    }
  }, [fetchFn])

  useEffect(() => {
    // StrictMode(dev)의 effect 이중 실행으로 인한 초기 중복 조회 방지
    if (initedRef.current === fetchFn) return
    initedRef.current = fetchFn
    load(true)
  }, [load, fetchFn])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) load(false)
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [load])

  return { items, loading, hasNext, sentinelRef, loadMore: () => load(false) }
}
