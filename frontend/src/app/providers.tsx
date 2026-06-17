'use client'
import { useState, useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { makeQueryClient } from '@/shared/lib/query-client'
import { initApiLayer } from '@/shared/api/init'
import type { QueryClient } from '@tanstack/react-query'
import { ToastProvider } from '@/components/global/Toast'
import { MuiProvider } from '@/shared/lib/mui-provider'
// axios interceptor + stomp-client에 auth-store 주입 (모듈 최초 로드 시 1회)
initApiLayer()

// ─── 간단한 테마 프로바이더 ───────────────────────────────────────────────────

function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem('ui-store')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { state?: { theme?: string } }
        const theme = parsed?.state?.theme
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      } catch {
        // 파싱 오류 무시
      }
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  return <>{children}</>
}

// ─── MSW 초기화 ───────────────────────────────────────────────────────────────

async function isBackendAlive(): Promise<boolean> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/actuator/health`,
      { signal: AbortSignal.timeout(1500) }
    )
    return res.ok
  } catch {
    return false
  }
}

async function initMsw() {
  if (process.env.NEXT_PUBLIC_APP_ENV !== 'development') return
  if (typeof window === 'undefined') return

  if (await isBackendAlive()) {
    console.info('[MSW] Backend detected — mocking disabled.')
    return
  }

  const { worker } = await import('@/mocks/browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
}

// ─── QueryClient 싱글톤 ───────────────────────────────────────────────────────

let clientQueryClient: QueryClient | undefined

function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return makeQueryClient()
  }
  if (!clientQueryClient) {
    clientQueryClient = makeQueryClient()
  }
  return clientQueryClient
}

// ─── Providers ────────────────────────────────────────────────────────────────

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  const [mswReady, setMswReady] = useState(
    process.env.NEXT_PUBLIC_APP_ENV !== 'development'
  )

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
      initMsw().finally(() => setMswReady(true))
    }
  }, [])

  // MSW 초기화 전에는 렌더링 보류 (개발 환경에서 짧은 순간)
  if (!mswReady) return null

  return (
    <MuiProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </MuiProvider>
  )
}
