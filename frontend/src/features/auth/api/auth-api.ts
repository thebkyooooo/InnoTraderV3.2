// Axios 기반 Auth API 함수 (orval 생성 전 임시)
import { axiosInstance } from '@/shared/api/axios-instance'

export interface RegisterRequest {
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
}

export interface UserResponse {
  userId: string
  email: string
  role: string
  status: string
}

export const authApi = {
  register: (data: RegisterRequest) =>
    axiosInstance.post<UserResponse>('/api/v1/auth/register', data),

  login: (data: LoginRequest) =>
    axiosInstance.post<TokenResponse>('/api/v1/auth/login', data),

  refresh: () =>
    axiosInstance.post<TokenResponse>('/api/v1/auth/refresh'),

  logout: () =>
    axiosInstance.post<void>('/api/v1/auth/logout'),

  me: () =>
    axiosInstance.get<UserResponse>('/api/v1/auth/me'),
}
