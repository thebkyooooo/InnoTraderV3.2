'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authApi } from './auth-api'
import { useAuthStore } from '@/store/auth-store'

const SESSION_COOKIE = 'auth_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 14 // 14일 (refreshToken과 동일)

// Secure — localhost는 브라우저가 secure context로 취급해 http에서도 정상 동작
function setSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${SESSION_MAX_AGE}; SameSite=Lax; Secure`
}

function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax; Secure`
}

// ─── useLogin ────────────────────────────────────────────────────────────────

export function useLogin() {
  const router = useRouter()
  const { setAccessToken, setUser } = useAuthStore()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (loginRes) => {
      const { accessToken } = loginRes.data
      setAccessToken(accessToken)
      setSessionCookie()

      try {
        const meRes = await authApi.me()
        const u = meRes.data
        setUser({
          userId: u.userId,
          email: u.email,
          role: u.role,
          status: u.status,
        })
      } catch {
        // /me 실패해도 토큰은 유지 — 조용히 무시
      }

      router.push('/dashboard')
    },
  })
}

// ─── useRegister ─────────────────────────────────────────────────────────────

export function useRegister() {
  const router = useRouter()

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      router.push('/login')
    },
  })
}

// ─── useLogout ───────────────────────────────────────────────────────────────

export function useLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { clearAuth } = useAuthStore()

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearAuth()
      clearSessionCookie()
      queryClient.clear()
      router.push('/login')
    },
  })
}

// ─── useCurrentUser ───────────────────────────────────────────────────────────

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await authApi.me()
      return res.data
    },
    enabled: isAuthenticated,
    retry: false,
  })
}
