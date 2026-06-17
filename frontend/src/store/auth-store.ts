import { create } from 'zustand'

// ─── 타입 정의 ────────────────────────────────────────────────────────────────

interface User {
  userId: string
  email: string
  role: string
  status: string
}

interface AuthState {
  /** Access Token — 메모리에만 저장 (XSS 방어) */
  accessToken: string | null
  /** 로그인된 사용자 정보 */
  user: User | null
  /** 인증 여부 */
  isAuthenticated: boolean
  /** Access Token 설정 */
  setAccessToken: (token: string | null) => void
  /** 사용자 정보 설정 */
  setUser: (user: User | null) => void
  /** 모든 인증 상태 초기화 */
  clearAuth: () => void
}

// ─── Zustand Store ────────────────────────────────────────────────────────────

/**
 * 인증 상태 스토어
 *
 * 보안 설계:
 * - Access Token은 메모리(Zustand store)에만 저장 → XSS 공격으로 탈취 불가
 * - Refresh Token은 httpOnly 쿠키에 저장 (백엔드 처리) → JS 접근 불가
 * - persist 없음 → 페이지 새로고침 시 RT로 자동 재발급 (axios interceptor 처리)
 */
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,

  setAccessToken: (token) =>
    set({ accessToken: token, isAuthenticated: !!token }),

  setUser: (user) => set({ user }),

  clearAuth: () =>
    set({ accessToken: null, user: null, isAuthenticated: false }),
}))

// ─── 스토어 외부 헬퍼 (axios interceptor용) ──────────────────────────────────

/**
 * React 컴포넌트 외부(axios interceptor)에서 스토어 상태를 읽고 쓰기 위한 헬퍼.
 * useAuthStore 훅은 컴포넌트 외부에서 호출 불가이므로 getState()를 사용.
 */
export const getAuthStoreState = () => useAuthStore.getState()

export function getAccessTokenFromStore(): string | null {
  return useAuthStore.getState().accessToken
}

export function setAccessTokenInStore(token: string | null): void {
  useAuthStore.getState().setAccessToken(token)
}
