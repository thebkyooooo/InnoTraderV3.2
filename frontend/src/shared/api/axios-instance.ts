import axios from 'axios'
import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

// auth-store에서 AT를 메모리로 읽어오는 함수 (순환 import 방지를 위해 동적 import 패턴 사용)
let getAccessToken: (() => string | null) | null = null
let setAccessToken: ((token: string | null) => void) | null = null

export function registerAuthStore(
  getter: () => string | null,
  setter: (token: string | null) => void
) {
  getAccessToken = getter
  setAccessToken = setter
}

// ─── Axios 인스턴스 ───────────────────────────────────────────────────────────

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080',
  withCredentials: true, // Refresh Token 쿠키 자동 전송
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
})

// ─── 토큰 만료 판단 헬퍼 ──────────────────────────────────────────────────────

/** JWT의 exp를 디코드해 bufferSec 이내 만료(또는 디코드 불가)면 true. */
function isAccessTokenExpiringSoon(token: string, bufferSec = 10): boolean {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64)) as { exp?: number }
    if (!payload.exp) return false
    return payload.exp - Date.now() / 1000 < bufferSec
  } catch {
    return true
  }
}

/** 로그인 세션 표식 쿠키(auth_session) 존재 여부. AT가 없어도 RT로 복구 가능한 상태인지 판단. */
function hasAuthSession(): boolean {
  return typeof document !== 'undefined' && document.cookie.includes('auth_session=1')
}

// ─── Request Interceptor (선제적 토큰 갱신) ───────────────────────────────────

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // refresh 요청 자체는 갱신 로직에서 제외 (무한 루프 방지)
    if (config.url?.includes('/auth/refresh')) return config

    let token = getAccessToken?.() ?? null
    // AT가 만료 임박이거나, 없지만 세션이 살아있으면(새로고침 직후) 요청 전에 미리 갱신.
    // refreshAccessToken은 single-flight라 동시 요청에도 /refresh는 한 번만 나간다.
    const shouldRefresh = token ? isAccessTokenExpiringSoon(token) : hasAuthSession()
    if (shouldRefresh) {
      try {
        token = await refreshAccessToken()
      } catch {
        // 갱신 실패 시 그대로 진행 → 응답 인터셉터가 로그아웃 처리
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── 공유 Refresh (single-flight) ─────────────────────────────────────────────

let refreshPromise: Promise<string> | null = null

/**
 * Access Token 재발급. 동시에 여러 번 호출돼도 진행 중인 단 하나의 `/refresh`
 * 요청을 공유한다(회전형 Refresh Token의 동시성 race로 인한 세션 폭파 방지).
 * 부트스트랩(AppLayout)과 401 응답 인터셉터가 이 함수를 함께 사용한다.
 */
export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axiosInstance
      .post<{ accessToken: string }>('/api/v1/auth/refresh')
      .then((res) => {
        const token = res.data.accessToken
        setAccessToken?.(token)
        return token
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

// ─── Response Interceptor (401 → Token Refresh) ───────────────────────────────

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }
    const status = error.response?.status

    // /auth/me 401/403 → AT 자체가 유효하지 않음, refresh 없이 바로 로그아웃
    if ([401, 403].includes(status) && originalRequest.url?.includes('/auth/me')) {
      setAccessToken?.(null)
      redirectToLogin()
      return Promise.reject(error)
    }

    // /auth/refresh 자체가 401이면 무한 루프 방지 + 로그아웃
    if (status === 401 && originalRequest.url?.includes('/auth/refresh')) {
      setAccessToken?.(null)
      return Promise.reject(error)
    }

    // 그 외 401 → 공유 refresh로 토큰 재발급 후 원 요청 1회 재시도
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const token = await refreshAccessToken()
        originalRequest.headers.Authorization = `Bearer ${token}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        setAccessToken?.(null)
        redirectToLogin()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

// ─── Orval mutator ────────────────────────────────────────────────────────────

/**
 * orval.config.ts의 mutator로 사용되는 함수
 * orval이 생성하는 API 함수들이 이 함수를 통해 요청을 보냄
 */
export const customAxios = <T>(config: AxiosRequestConfig): Promise<T> => {
  return axiosInstance(config).then((response: AxiosResponse<T>) => response.data)
}

export default axiosInstance
