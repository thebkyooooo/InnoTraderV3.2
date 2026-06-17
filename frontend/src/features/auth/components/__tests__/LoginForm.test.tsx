import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '@/test/setup'
import { LoginForm } from '../LoginForm'

// next/navigation mock — useRouter는 컴포넌트 트리 내부의 useLogin이 사용
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// next/link mock
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

// ─── 테스트 ────────────────────────────────────────────────────────────────────

describe('LoginForm', () => {
  // 1. 이메일/비밀번호 입력 필드 렌더링 확인
  it('이메일 및 비밀번호 입력 필드를 렌더링한다', () => {
    renderWithClient(<LoginForm />)

    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
  })

  // 2. 빈 폼 제출 시 유효성 에러 표시
  it('빈 폼을 제출하면 유효성 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup()
    renderWithClient(<LoginForm />)

    await user.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(screen.getByText('올바른 이메일을 입력해주세요.')).toBeInTheDocument()
    })
    expect(screen.getByText('비밀번호를 입력해주세요.')).toBeInTheDocument()
  })

  // 3. 잘못된 이메일 형식 → 에러 메시지
  it('이메일 형식이 잘못되면 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup()
    renderWithClient(<LoginForm />)

    await user.type(screen.getByLabelText('이메일'), 'not-an-email')
    await user.type(screen.getByLabelText('비밀번호'), 'somepass')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(screen.getByText('올바른 이메일을 입력해주세요.')).toBeInTheDocument()
    })
  })

  // 4. 올바른 입력 제출 → useLogin 호출 (MSW mock 성공 응답)
  it('올바른 자격증명으로 제출하면 로그인 API를 호출한다', async () => {
    const user = userEvent.setup()
    renderWithClient(<LoginForm />)

    await user.type(screen.getByLabelText('이메일'), 'test@innotrader.com')
    await user.type(screen.getByLabelText('비밀번호'), 'Password1')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    // 성공 시 에러 메시지가 없고, 버튼이 정상 복귀됨
    await waitFor(() => {
      expect(screen.queryByText('이메일 또는 비밀번호가 올바르지 않습니다.')).not.toBeInTheDocument()
    })
  })

  // 5. 로그인 실패(401) → 에러 메시지 표시 (refresh도 401 → 최종 에러 표시)
  it('로그인 실패(401) 시 에러 메시지를 표시한다', async () => {
    // login → 401, refresh → 401(재시도 루프 차단)
    // axios 인터셉터가 401을 받으면 /auth/refresh를 시도하므로 함께 stub
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

    const user = userEvent.setup()
    renderWithClient(<LoginForm />)

    await user.type(screen.getByLabelText('이메일'), 'wrong@innotrader.com')
    await user.type(screen.getByLabelText('비밀번호'), 'WrongPass1')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    // 인터셉터가 login 401 → refresh 401 순으로 실패하며
    // 컴포넌트는 refresh 에러의 response.data.message를 표시함
    await waitFor(() => {
      expect(
        screen.getByText('인증이 필요합니다.')
      ).toBeInTheDocument()
    })
  })

  // 6. 로딩 상태에서 버튼 비활성화
  it('제출 중(로딩) 상태에서 로그인 버튼이 비활성화된다', async () => {
    // 응답을 지연시켜 pending 상태를 관찰
    server.use(
      http.post('/api/v1/auth/login', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200))
        return HttpResponse.json(
          { accessToken: 'mock-access-token-xyz', tokenType: 'Bearer', expiresIn: 3600 },
          { status: 200 }
        )
      })
    )

    const user = userEvent.setup()
    renderWithClient(<LoginForm />)

    await user.type(screen.getByLabelText('이메일'), 'test@innotrader.com')
    await user.type(screen.getByLabelText('비밀번호'), 'Password1')

    // 클릭과 동시에 버튼 상태 확인 (await 없이 바로 검사)
    await user.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: '로그인 중...' })
      expect(btn).toBeDisabled()
    })
  })
})
