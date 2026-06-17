<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# frontend

## Purpose
Next.js 15 App Router 기반 트레이딩 플랫폼 UI. TanStack Query로 서버 상태, Zustand로 클라이언트 상태(인증 토큰)를 관리한다. Tailwind CSS + Radix UI로 스타일링하며 Orval로 백엔드 API 클라이언트를 자동 생성한다.

## Key Files
| File | Description |
|------|-------------|
| `package.json` | 의존성 및 npm 스크립트 |
| `next.config.ts` | Next.js 설정 |
| `tsconfig.json` | TypeScript 설정 (`@/` 경로 별칭 포함) |
| `tailwind.config.ts` | Tailwind CSS 설정 |
| `orval.config.ts` | Orval API 코드 자동 생성 설정 |
| `vitest.config.ts` | Vitest 단위 테스트 설정 |
| `playwright.config.ts` | Playwright E2E 테스트 설정 |
| `.env.example` | 환경 변수 템플릿 |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `src/app/` | Next.js App Router 페이지 및 레이아웃 (see `src/app/AGENTS.md`) |
| `src/features/` | 기능별 모듈 — API, 컴포넌트, 스키마 (see `src/features/AGENTS.md`) |
| `src/shared/` | 공유 유틸리티 — axios 인스턴스, query client (see `src/shared/AGENTS.md`) |
| `src/store/` | Zustand 전역 상태 저장소 (see `src/store/AGENTS.md`) |
| `src/mocks/` | MSW Mock Service Worker 핸들러 |
| `src/test/` | 테스트 설정 및 E2E 스펙 |

## For AI Agents

### Working In This Directory
- `npm run dev` 로 개발 서버 실행 (Turbopack 사용)
- API 타입 변경 시 `npm run generate:api` 로 Orval 재생성
- 경로 별칭: `@/` = `src/` (tsconfig paths)
- Access Token은 메모리(Zustand)에만 저장 — localStorage/cookie 저장 금지

### Testing Requirements
- 단위 테스트: `npm run test` (Vitest)
- E2E: `npm run test:e2e` (Playwright)
- 커버리지: `npm run test:coverage`

### Common Patterns
- 서버 컴포넌트는 데이터 fetch, 클라이언트 컴포넌트는 인터랙션 담당
- `'use client'` 지시어는 필요한 최소 범위에만 적용
- API 호출은 `src/shared/api/axios-instance.ts` 의 `axiosInstance` 사용

## Dependencies

### External
- Next.js 15.3, React 19
- TanStack Query 5 — 서버 상태 관리
- Zustand 5 — 클라이언트 상태
- Tailwind CSS 3.4 + Radix UI — UI
- Axios 1.9 — HTTP 클라이언트
- Zod 3 + React Hook Form 7 — 폼 유효성 검사
- MSW 2.9 — API 모킹
- Orval 7.9 — API 코드 자동 생성
- Vitest 3, Playwright 1.52 — 테스트

<!-- MANUAL: -->
