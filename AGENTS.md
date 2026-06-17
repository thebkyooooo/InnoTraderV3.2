<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# InnoTraderV3.2

## Purpose
주식/금융 트레이딩 플랫폼. Spring Boot 백엔드(헥사고날 아키텍처)와 Next.js 프론트엔드로 구성된 풀스택 모노레포. JWT 인증, Redis 세션, PostgreSQL, WebSocket 실시간 거래를 지원한다.

## Key Files
| File | Description |
|------|-------------|
| `docker-compose.yml` | PostgreSQL, Redis, Redis Commander 로컬 개발 환경 |
| `README.md` | 프로젝트 개요 및 실행 방법 |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `backend/` | Spring Boot 3.4 API 서버 — 헥사고날 아키텍처 (see `backend/AGENTS.md`) |
| `frontend/` | Next.js 15 App Router SPA — TanStack Query, Zustand (see `frontend/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- 로컬 개발 시 반드시 `docker compose up -d` 로 PostgreSQL·Redis를 먼저 기동할 것
- 백엔드는 `local` 프로파일로 실행: `./gradlew bootRun --args='--spring.profiles.active=local'`
- 프론트엔드는 `frontend/` 에서 `npm run dev`

### Testing Requirements
- 백엔드: `./gradlew test` (JUnit5 + ArchUnit)
- 프론트엔드: `npm run test` (Vitest), `npm run test:e2e` (Playwright)

### Common Patterns
- 인프라 변경은 `docker-compose.yml` 수정 후 `docker compose up -d` 재기동
- 환경 변수는 `backend/src/main/resources/application.yml` 및 `frontend/.env.example` 참조

## Dependencies

### External
- Docker Desktop — 로컬 인프라 (PostgreSQL 16, Redis 7)
- Oracle JDK 21 — 백엔드 런타임
- Node.js 20+ — 프론트엔드 런타임

<!-- MANUAL: -->
