<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# frontend/src

## Purpose
Next.js 애플리케이션 소스 루트. Feature-based 구조로 기능 단위 모듈을 분리하고, App Router 페이지·레이아웃과 공유 인프라를 포함한다.

## Key Files
| File | Description |
|------|-------------|
| `middleware.ts` | Next.js 미들웨어 — 인증 여부에 따른 라우트 보호 및 리다이렉트 |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js App Router — 페이지, 레이아웃, 라우트 그룹 (see `app/AGENTS.md`) |
| `features/` | 기능 모듈 — auth 등 도메인별 API·컴포넌트·스키마 (see `features/AGENTS.md`) |
| `shared/` | 공유 인프라 — axios, query client, 유틸리티 (see `shared/AGENTS.md`) |
| `store/` | Zustand 전역 상태 — auth, UI (see `store/AGENTS.md`) |
| `mocks/` | MSW 핸들러 — 개발 환경 API 모킹 |
| `test/` | 테스트 설정 및 E2E 스펙 |

## For AI Agents

### Working In This Directory
- 미들웨어(`middleware.ts`)는 `auth_session` 쿠키로 인증 여부를 판단
- 보호 경로: `/dashboard/**`, `/trade/**`
- 공개 경로: `/login`, `/register`, `/forgot-password`
- 인증 쿠키(`auth_session`)는 로그인 성공 시 `use-auth.ts`에서 설정, 로그아웃 시 삭제

### Common Patterns
- `@/` 경로 별칭은 `src/` 를 가리킴
- 클라이언트 컴포넌트는 `'use client'` 지시어 필수

<!-- MANUAL: -->
