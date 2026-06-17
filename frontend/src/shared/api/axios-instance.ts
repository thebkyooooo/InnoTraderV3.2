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

// ─── Request Interceptor ──────────────────────────────────────────────────────

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken?.()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor (401 → Token Refresh) ───────────────────────────────

let isRefreshing = false
// 토큰 재발급 대기 중인 요청 큐
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else if (token) {
      resolve(token)
    }
  })
  failedQueue = []
}

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // /auth/me 401/403 → AT 자체가 유효하지 않음, refresh 없이 바로 로그아웃
    if (
      [401, 403].includes(error.response?.status) &&
      originalRequest.url?.includes('/auth/me')
    ) {
      setAccessToken?.(null)
      redirectToLogin()
      return Promise.reject(error)
    }

    // 401 오류이고 아직 재시도하지 않은 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      // /auth/refresh 자체가 401이면 무한 루프 방지
      if (originalRequest.url?.includes('/auth/refresh')) {
        setAccessToken?.(null)
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // 이미 재발급 중이면 큐에 추가하여 완료 후 재시도
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return axiosInstance(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Refresh Token(httpOnly 쿠키)으로 Access Token 재발급
        const response = await axiosInstance.post<{ accessToken: string }>(
          '/api/v1/auth/refresh'
        )
        const newToken = response.data.accessToken

        // 메모리에 새 AT 저장
        setAccessToken?.(newToken)

        // 대기 중인 요청들 처리
        processQueue(null, newToken)

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        // 재발급 실패 → 로그아웃 처리
        setAccessToken?.(null)
        redirectToLogin()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
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
