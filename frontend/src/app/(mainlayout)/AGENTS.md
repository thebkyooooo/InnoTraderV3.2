<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# frontend/src/app/(mainlayout)

## Purpose
대시보드 라우트 그룹. 사이드바·헤더가 포함된 앱 쉘 레이아웃을 제공한다. 미들웨어가 인증을 강제하는 보호된 영역이다.

## Key Files
| File | Description |
|------|-------------|
| `layout.tsx` | 앱 쉘 레이아웃 — 사이드바(w-64), 상단 헤더(h-16), `<LogoutButton />` |
| `dashboard/page.tsx` | `/dashboard` 메인 페이지 — 평가금액·손익·주문대기 스탯, 최근 체결 테이블 |
| `dashboard/portfolio/page.tsx` | `/dashboard/portfolio` 포트폴리오 페이지 |
| `portfolio/page.tsx` | `/portfolio` → `/dashboard/portfolio` 리다이렉트 |

## For AI Agents

### Working In This Directory
- `layout.tsx`에 `export const dynamic = 'force-dynamic'` 적용 — 실시간 데이터 지원
- 사이드바 네비게이션은 현재 하드코딩 — 추후 `<Sidebar />` 컴포넌트로 교체 예정 (TODO 주석 있음)
- 헤더도 추후 `<Header />` 컴포넌트로 교체 예정
- 새 대시보드 하위 페이지는 `dashboard/{slug}/page.tsx` 형태로 추가

### URL 구조
| URL | 파일 경로 |
|-----|---------|
| `/dashboard` | `dashboard/page.tsx` |
| `/dashboard/portfolio` | `dashboard/portfolio/page.tsx` |
| `/portfolio` | `portfolio/page.tsx` (리다이렉트) |

### Dependencies
- `@/features/auth/components/LogoutButton` — 사이드바 하단 사용자 정보·로그아웃

<!-- MANUAL: -->
