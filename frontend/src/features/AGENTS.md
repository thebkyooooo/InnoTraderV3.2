<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# frontend/src/features

## Purpose
도메인 기능 단위 모듈. 각 기능은 `api/`, `components/`, `schema/` 서브 디렉토리로 구성되어 관심사를 분리한다.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `auth/` | 인증 기능 — 로그인·회원가입 API, 폼 컴포넌트, Zod 스키마 (see `auth/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- 새 기능 추가 시 `features/{domain}/` 디렉토리 생성
- 구조 패턴: `api/` (API 함수·훅), `components/` (UI), `schema/` (Zod 유효성 검사)
- 기능 간 직접 import 지양 — 공유 로직은 `src/shared/` 로 이동

<!-- MANUAL: -->
