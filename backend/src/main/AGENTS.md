<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# backend/src/main

## Purpose
Spring Boot 애플리케이션 메인 소스. Java 소스와 리소스 설정 파일을 포함한다.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `java/com/innotrader/` | 애플리케이션 Java 소스 — common, user 패키지 (see `java/AGENTS.md`) |
| `resources/` | 설정 파일 및 Flyway SQL 마이그레이션 |

## Key Files (resources/)
| File | Description |
|------|-------------|
| `resources/application.yml` | 기본 설정 — DB, Redis, JWT, CORS, JPA |
| `resources/application-local.yml` | 로컬 프로파일 설정 — 디버그 로깅, SQL 출력 |
| `resources/db/migration/V1__create_core_tables.sql` | 핵심 테이블 DDL — users, accounts, instruments, orders, executions, positions, notifications |

## For AI Agents

### Working In This Directory
- Flyway 마이그레이션 추가 시 `V{현재최대+1}__설명.sql` 형식 준수
- 현재 최신 버전: `V1` → 다음은 `V2__...sql`
- `application.yml` 의 환경 변수는 `${ENV_VAR:기본값}` 형식으로 정의

### Common Patterns
- DB URL 기본값: `jdbc:postgresql://localhost:5432/innotrader`
- JWT secret 기본값은 개발용 — 운영 환경에서 반드시 교체
- `ddl-auto: validate` — Hibernate가 스키마를 검증만 하고 변경하지 않음 (Flyway가 관리)

<!-- MANUAL: -->
