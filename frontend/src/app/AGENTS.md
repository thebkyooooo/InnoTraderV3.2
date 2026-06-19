<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# frontend/src/app

## Purpose
Next.js App Router 라우트 정의. 라우트 그룹(`(auth)`, `(mainlayout)`, `(trading)`)으로 레이아웃을 분리하고, 각 그룹은 독립적인 layout.tsx를 가진다.

## Key Files
| File | Description |
|------|-------------|
| `layout.tsx` | 루트 레이아웃 — HTML shell, Providers 래핑 |
| `page.tsx` | 루트 페이지 — `/login` 으로 리다이렉트 |
| `providers.tsx` | 클라이언트 프로바이더 — QueryClient, ThemeProvider, MSW 초기화, ReactQueryDevtools |
| `globals.css` | 전역 Tailwind CSS 및 CSS 변수 |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `(auth)/` | 인증 라우트 그룹 — 로그인·회원가입 레이아웃 (see `(auth)/AGENTS.md`) |
| `(mainlayout)/` | 대시보드 라우트 그룹 — 사이드바·헤더 레이아웃 (see `(mainlayout)/AGENTS.md`) |
| `(trading)/` | 트레이딩 라우트 그룹 — 거래 화면 |

## For AI Agents

### Working In This Directory
- 라우트 그룹 `(name)` 은 URL에 포함되지 않음 — `(mainlayout)/dashboard/page.tsx` → `/dashboard`
- 새 페이지 추가 시 적절한 라우트 그룹 하위에 위치시킬 것
- `providers.tsx` 의 `initApiLayer()` 는 axios interceptor에 auth store를 연결 — 모듈 로드 시 1회 실행

### URL 구조
| URL | 파일 경로 |
|-----|---------|
| `/` | `page.tsx` → redirect `/login` |
| `/login` | `(auth)/login/page.tsx` |
| `/register` | `(auth)/register/page.tsx` |
| `/dashboard` | `(mainlayout)/dashboard/page.tsx` |
| `/dashboard/portfolio` | `(mainlayout)/dashboard/portfolio/page.tsx` |

### Common Patterns
- 서버 컴포넌트가 기본 — 인터랙션 필요 시만 `'use client'`
- `export const dynamic = 'force-dynamic'` — 실시간 데이터 페이지에 적용

<!-- MANUAL: -->
