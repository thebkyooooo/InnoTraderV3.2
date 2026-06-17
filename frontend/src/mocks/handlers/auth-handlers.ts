import { http, HttpResponse } from 'msw'

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/api/v1`

interface LoginBody { email: string; password: string }
interface RegisterBody { email: string; password: string }

// 테스트 계정
const TEST_USER = {
  userId: 'user-001',
  email: 'test@innotrader.com',
  role: 'USER',
  status: 'ACTIVE',
}

const MOCK_TOKEN = {
  accessToken: 'mock-access-token-xyz',
  tokenType: 'Bearer',
  expiresIn: 3600,
}

// 이메일 중복 체크용 목록
const EXISTING_EMAILS = new Set(['existing@innotrader.com'])

export const authHandlers = [
  // ── POST /api/v1/auth/login ──────────────────────────────────────────────
  http.post<never, LoginBody>(`${BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json()

    if (body.email === TEST_USER.email && body.password === 'Password1') {
      return HttpResponse.json(MOCK_TOKEN, { status: 200 })
    }

    return HttpResponse.json(
      { code: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
      { status: 401 }
    )
  }),

  // ── POST /api/v1/auth/register ───────────────────────────────────────────
  http.post<never, RegisterBody>(`${BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json()

    if (EXISTING_EMAILS.has(body.email)) {
      return HttpResponse.json(
        { code: 'EMAIL_ALREADY_EXISTS', message: '이미 사용 중인 이메일입니다.' },
        { status: 409 }
      )
    }

    return HttpResponse.json(
      {
        userId: `user-${Date.now()}`,
        email: body.email,
        role: 'USER',
        status: 'ACTIVE',
      },
      { status: 201 }
    )
  }),

  // ── POST /api/v1/auth/refresh ────────────────────────────────────────────
  http.post(`${BASE_URL}/auth/refresh`, () => {
    return HttpResponse.json(
      {
        accessToken: 'mock-refreshed-access-token-abc',
        tokenType: 'Bearer',
        expiresIn: 3600,
      },
      { status: 200 }
    )
  }),

  // ── POST /api/v1/auth/logout ─────────────────────────────────────────────
  http.post(`${BASE_URL}/auth/logout`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // ── GET /api/v1/auth/me ──────────────────────────────────────────────────
  http.get(`${BASE_URL}/auth/me`, ({ request }) => {
    const auth = request.headers.get('Authorization')

    if (!auth || !auth.startsWith('Bearer mock-')) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    return HttpResponse.json(TEST_USER, { status: 200 })
  }),
]
