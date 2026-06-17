'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { registerSchema, type RegisterFormValues } from '@/features/auth/schema/auth-schema'
import { useRegister } from '@/features/auth/api/use-auth'

// ─── 비밀번호 강도 표시 ───────────────────────────────────────────────────────

function PasswordStrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    password.length >= 12,
  ]
  const score = checks.filter(Boolean).length

  const label = ['', '약함', '보통', '강함', '매우 강함'][score] ?? ''
  const colors = [
    'bg-muted',
    'bg-destructive',
    'bg-yellow-400',
    'bg-green-400',
    'bg-green-600',
  ]

  if (!password) return null

  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= score ? colors[score] : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        비밀번호 강도:{' '}
        <span
          className={
            score <= 1
              ? 'text-destructive'
              : score === 2
                ? 'text-yellow-500'
                : 'text-green-600'
          }
        >
          {label}
        </span>
      </p>
    </div>
  )
}

// ─── RegisterForm ─────────────────────────────────────────────────────────────

export function RegisterForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  const { mutate: registerUser, isPending, error } = useRegister()

  const passwordValue = watch('password', '')

  const serverError = (() => {
    if (!error) return null
    const e = error as { response?: { data?: { message?: string; code?: string } } }
    if (e.response?.data?.code === 'EMAIL_ALREADY_EXISTS') {
      return '이미 사용 중인 이메일입니다.'
    }
    return e.response?.data?.message ?? '회원가입에 실패했습니다. 다시 시도해주세요.'
  })()

  const onSubmit = (values: RegisterFormValues) => {
    registerUser({ email: values.email, password: values.password })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* 서버 에러 */}
        {serverError && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

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
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* 비밀번호 */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="8자 이상, 대문자·숫자 포함"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            {...register('password')}
            disabled={isPending}
          />
          <PasswordStrengthBar password={passwordValue} />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* 비밀번호 확인 */}
        <div className="space-y-1.5">
          <label htmlFor="passwordConfirm" className="text-sm font-medium text-foreground">
            비밀번호 확인
          </label>
          <input
            id="passwordConfirm"
            type="password"
            autoComplete="new-password"
            placeholder="비밀번호를 다시 입력해주세요"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            {...register('passwordConfirm')}
            disabled={isPending}
          />
          {errors.passwordConfirm && (
            <p className="text-xs text-destructive">{errors.passwordConfirm.message}</p>
          )}
        </div>

        {/* 회원가입 버튼 */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? '가입 중...' : '회원가입'}
        </button>
      </form>

      {/* 로그인 링크 */}
      <div className="flex justify-between mt-4 -mb-2 text-center text-xs text-muted-foreground">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          로그인
        </Link>
      </div>
    </div>
  )
}
