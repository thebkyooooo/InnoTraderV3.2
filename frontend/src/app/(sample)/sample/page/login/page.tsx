import { LoginForm } from '@/features/auth/components/LoginForm'

export default function SampleLoginPage() {
  return (
    <>
      <div className="flex flex-col gap-4 w-full h-full p-4">

        <h1 className="text-lg font-bold text-foreground">로그인 샘플 페이지</h1>

        <div className='flex-1 flex justify-center items-center'>
          <div className="w-full max-w-[320px] px-4">
            {/* 로고 */}
            <div className="flex justify-center">
              <span className="text-3xl font-bold text-foreground">InnoTrader</span>
            </div>
            <div className="mb-4 text-center">
              <p className="text-muted-foreground">로그인 후 이용할 수 있습니다</p>
            </div>
            {/* 로그인 컴포넌트 */}
            <LoginForm />

            {/* 푸터 */}
            <p className="text-center text-xs text-muted-foreground mt-4">
              &copy; {new Date().getFullYear()} InnoTrader. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
