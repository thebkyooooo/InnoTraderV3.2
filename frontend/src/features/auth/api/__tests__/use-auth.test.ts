import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { server } from '@/test/setup'
import { useLogin, useLogout } from '../use-auth'
import { useAuthStore } from '@/store/auth-store'

// next/navigation mock
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

// ─── 테스트 ────────────────────────────────────────────────────────────────────

describe('useLogin', () => {
  beforeEach(() => {
    // 각 테스트 전 auth store 초기화
    useAuthStore.getState().clearAuth()
    mockPush.mockClear()
  })

  // 1. 성공 시 auth-store에 accessToken 저장
  it('로그인 성공 시 auth-store에 accessToken이 저장된다', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useLogin(), { wrapper })

    act(() => {
      result.current.mutate({ email: 'test@innotrader.com', password: 'Password1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const { accessToken, isAuthenticated } = useAuthStore.getState()
    expect(accessToken).toBe('mock-access-token-xyz')
    expect(isAuthenticated).toBe(true)
  })

  // 2. 성공 시 /dashboard로 라우팅
  it('로그인 성공 시 /dashboard로 이동한다', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useLogin(), { wrapper })

    act(() => {
      result.current.mutate({ email: 'test@innotrader.com', password: 'Password1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  // 3. 실패 시 에러 반환
  it('로그인 실패(401) 시 mutation error가 설정된다', async () => {
    // login 401 + refresh 401(인터셉터 재시도 루프 차단)
    server.use(
      http.post('/api/v1/auth/login', () =>
        HttpResponse.json(
          { code: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
          { status: 401 }
        )
      ),
      http.post('/api/v1/auth/refresh', () =>
        HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
          { status: 401 }
        )
      )
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => useLogin(), { wrapper })

    act(() => {
      result.current.mutate({ email: 'wrong@innotrader.com', password: 'WrongPass1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeTruthy()
    // auth store는 변경되지 않아야 함
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})

describe('useLogout', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  // 4. 로그아웃 호출 시 clearAuth() 호출
  it('로그아웃 호출 시 auth-store가 초기화된다', async () => {
    // 먼저 로그인 상태로 설정
    useAuthStore.getState().setAccessToken('mock-access-token-xyz')
    useAuthStore.getState().setUser({
      userId: 'user-001',
      email: 'test@innotrader.com',
      role: 'USER',
      status: 'ACTIVE',
    })

    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    const wrapper = createWrapper()
    const { result } = renderHook(() => useLogout(), { wrapper })

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true))

    // onSettled에서 항상 clearAuth() 호출
    const { accessToken, user, isAuthenticated } = useAuthStore.getState()
    expect(accessToken).toBeNull()
    expect(user).toBeNull()
    expect(isAuthenticated).toBe(false)
  })

  // 5. 로그아웃 후 /login으로 리다이렉트
  it('로그아웃 후 /login으로 이동한다', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useLogout(), { wrapper })

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true))
    expect(mockPush).toHaveBeenCalledWith('/login')
  })
})
