import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * 인증이 필요한 경로 패턴
 * - /dashboard/** : 대시보드 전체
 * - /trade/**     : 트레이딩 뷰
 * - /portfolio/** : 포트폴리오 (라우트 그룹 외부에서 접근하는 경우)
 */
const PROTECTED_PATHS = ['/dashboard', '/trade', '/watchlist', '/market', '/order', '/settings', '/portfolio']

/**
 * 인증 없이 접근 가능한 공개 경로
 */
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password']

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname.startsWith(path))
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 정적 파일, API 라우트, Next.js 내부 경로는 미들웨어 적용 제외
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Access Token 확인 (httpOnly 쿠키 또는 일반 쿠키)
  // 실제 운영에서는 httpOnly refresh token 쿠키로 서버 사이드 검증
  const authSession = request.cookies.get('auth_session')?.value

  const isAuthenticated = !!authSession

  // 보호된 경로 접근 시 인증 없으면 로그인 페이지로 리다이렉트
  if (isProtectedPath(pathname) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    // 원래 가려던 경로를 쿼리 파라미터로 전달 (로그인 후 복귀용)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 이미 인증된 사용자가 로그인/회원가입 페이지 접근 시 대시보드로 리다이렉트
  if (isPublicPath(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청에 미들웨어 적용:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico
     * - 공개 파일 (public 디렉토리)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|mockServiceWorker.js).*)',
  ],
}
