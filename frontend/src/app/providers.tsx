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
    // 라이트 모드 고정 — 시스템 다크/저장값과 무관하게 .dark 제거
    document.documentElement.classList.remove('dark')
  }, [])

  return <>{children}</>
}

// ─── MSW 초기화 ───────────────────────────────────────────────────────────────

async function isBackendAlive(): Promise<boolean> {
  // 이전 세션의 MSW 서비스워커가 이 페이지를 제어 중이면, 아래 헬스체크 fetch가 워커에
  // 가로채여 죽은 백엔드로 passthrough되고 SW 레벨에서 무해한 'Failed to fetch'
  // unhandledrejection이 발생한다(앱 try/catch로는 잡히지 않음). 프로브 동안만 억제한다.
  const suppress = (e: PromiseRejectionEvent) => {
    if (e.reason instanceof TypeError && e.reason.message === 'Failed to fetch') {
      e.preventDefault()
    }
  }
  window.addEventListener('unhandledrejection', suppress)
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/actuator/health`,
      { signal: AbortSignal.timeout(1500) }
    )
    return res.ok
  } catch {
    return false
  } finally {
    // SW의 rejection은 fetch 직후 비동기로 표면화되므로 잠시 뒤 리스너 제거
    setTimeout(() => window.removeEventListener('unhandledrejection', suppress), 2000)
  }
}

async function initMsw() {
  if (process.env.NEXT_PUBLIC_APP_ENV !== 'development') return
  if (typeof window === 'undefined') return

  if (await isBackendAlive()) {
    console.info('[MSW] Backend detected — mocking disabled.')
    // 이전 세션(백엔드 미가동 시)에 등록된 스테일 서비스워커 제거.
    // 남아있으면 요청을 가로채 passthrough "Failed to fetch" 오류를 유발한다.
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(
        regs
          .filter(r => r.active?.scriptURL.includes('mockServiceWorker.js'))
          .map(r => r.unregister())
      )
    }
    return
  }

  const { worker } = await import('@/mocks/browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  })

  // 새로 등록/활성화된 서비스워커가 아직 현재 페이지를 '제어'하지 않으면 요청이
  // 인터셉트되지 않고 실제 백엔드로 새어나가(ERR_CONNECTION_REFUSED) 모킹이 동작하지 않는다.
  // 이 경우 한 번만 새로고침해 SW가 페이지를 제어하도록 한다(루프 방지: 세션당 1회).
  if (!navigator.serviceWorker.controller) {
    if (!sessionStorage.getItem('msw-reloaded')) {
      sessionStorage.setItem('msw-reloaded', '1')
      window.location.reload()
    }
  } else {
    sessionStorage.removeItem('msw-reloaded')
  }
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
