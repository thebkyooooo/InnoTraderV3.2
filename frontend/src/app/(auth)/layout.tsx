import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '로그인',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-[320px] px-4">
        {/* 로고 */}
        <div className="flex justify-center">
          <span className="text-3xl font-bold text-foreground">InnoTrader</span>
        </div>
        {/* 콘텐츠 */}
        <div>
          {children}
        </div>
        {/* 푸터 */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          &copy; {new Date().getFullYear()} InnoTrader. All rights reserved.
        </p>
      </div>
    </div>
  )
}
