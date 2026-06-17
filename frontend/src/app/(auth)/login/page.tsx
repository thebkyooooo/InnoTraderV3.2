import type { Metadata } from 'next'
import { LoginForm } from '@/features/auth/components/LoginForm'

export const metadata: Metadata = { title: 'InnoTrader — 로그인' }

export default function LoginPage() {
  return (
    <>
      <div className="mb-4 text-center">
        <p className="text-muted-foreground">로그인 후 이용할 수 있습니다</p>
      </div>
      <LoginForm />
    </>
  )
}
