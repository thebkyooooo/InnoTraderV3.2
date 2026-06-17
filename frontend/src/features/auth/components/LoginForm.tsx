'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { loginSchema, type LoginFormValues } from '@/features/auth/schema/auth-schema'
import { useLogin } from '@/features/auth/api/use-auth'

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const { mutate: login, isPending, error } = useLogin()

  // axios 에러에서 서버 메시지 추출
  const serverError = (() => {
    if (!error) return null
    const e = error as { response?: { data?: { message?: string } } }
    return e.response?.data?.message ?? '로그인에 실패했습니다. 다시 시도해주세요.'
  })()

  const onSubmit = (values: LoginFormValues) => {
    login(values)
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-8 relative">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* 이메일 */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            이메일
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            {...register('email')}
            disabled={isPending}
          />
          {errors.email && (
            <p className="text-xs text-destructive" style={{ marginBottom: '-18px', marginTop: '2px' }}>{errors.email.message}
            </p>
          )}
        </div>

        {/* 비밀번호 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              비밀번호
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              비밀번호 찾기
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호 입력"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            {...register('password')}
            disabled={isPending}
          />
          {errors.password && (
            <p className="text-xs text-destructive" style={{ marginBottom: '-18px', marginTop: '2px' }}>{errors.password.message}</p>
          )}
        </div>

        {/* 로그인 버튼 */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? '로그인 중...' : '로그인'}
        </button>
      </form>

      {/* 로그인 테스트 계정 */}
      <div className="flex flex-col gap-1 mt-4 text-xs text-muted-foreground border border-muted rounded-md p-3 bg-muted/90">
        <ul className="flex flex-col text-center">
          <li className="flex items-center justify-between">
            <span>테스트 계정:</span><span>test@innotrader.com</span>
          </li>
          <li className="flex items-center justify-between">
            <span>비밀번호:</span><span>Test1234!</span>
          </li>
        </ul>
      </div>

      {/* 회원가입 링크 */}
      <div className="flex justify-between mt-4 -mb-2 text-center text-xs text-muted-foreground">
        계정이 없으신가요?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          회원가입
        </Link>
      </div>

      {/* 서버 에러 */}
      {serverError && (
        <div className="flex items-center justify-center rounded-md bg-destructive/20 p-8 text-sm font-medium text-destructive absolute bottom-0 left-0 w-full h-full z-100">
          {serverError}
        </div>
      )}
    </div>
  )
}
