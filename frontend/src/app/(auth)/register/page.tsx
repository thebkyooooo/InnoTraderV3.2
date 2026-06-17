import type { Metadata } from 'next'
import { RegisterForm } from '@/features/auth/components/RegisterForm'

export const metadata: Metadata = { title: 'InnoTrader — 회원가입' }

export default function RegisterPage() {
  return (
    <>
      <div className="mb-4 text-center">
        <p className="text-muted-foreground">새 계정을 만들어 시작하세요</p>
      </div>
      <RegisterForm />
    </>
  )
}
