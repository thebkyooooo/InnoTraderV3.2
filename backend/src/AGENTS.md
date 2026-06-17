<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# backend/src

## Purpose
백엔드 소스 루트. `main/`에 애플리케이션 코드, `test/`에 테스트 코드가 위치한다.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `main/` | 애플리케이션 소스 — Java 코드 및 리소스 (see `main/AGENTS.md`) |
| `test/` | 테스트 코드 — ArchUnit 헥사고날 아키텍처 검증 |

## For AI Agents

### Working In This Directory
- `main/java/` 에서 Java 소스 편집
- `main/resources/` 에서 설정 파일 및 Flyway SQL 관리
- 새 마이그레이션은 반드시 `V{n+1}__description.sql` 형식으로 추가

<!-- MANUAL: -->
