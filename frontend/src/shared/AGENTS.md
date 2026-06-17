<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# frontend/src/shared

## Purpose
애플리케이션 전반에서 사용하는 공유 인프라. HTTP 클라이언트, TanStack Query 설정, 유틸리티 함수를 포함한다.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `api/` | axios 인스턴스, interceptor, STOMP 클라이언트, Orval 생성 코드 (see `api/AGENTS.md`) |
| `lib/` | query-client 팩토리, 유틸리티 함수 |

## Key Files (lib/)
| File | Description |
|------|-------------|
| `lib/query-client.ts` | TanStack Query 클라이언트 팩토리 — 서버/클라이언트 싱글톤 분리 |
| `lib/utils.ts` | `cn()` 유틸리티 — clsx + tailwind-merge |

## For AI Agents

### Working In This Directory
- 새 API 엔드포인트는 `api/` 하위에 추가
- `lib/utils.ts` 의 `cn()` 함수는 Tailwind 클래스 병합에 사용

<!-- MANUAL: -->
