<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# backend

## Purpose
Spring Boot 3.4.1 기반 RESTful API 서버. 헥사고날 아키텍처(Ports & Adapters)로 설계되어 도메인 로직이 인프라에 의존하지 않는다. JWT 인증, Flyway DB 마이그레이션, Redis 세션, WebSocket 실시간 거래를 제공한다.

## Key Files
| File | Description |
|------|-------------|
| `build.gradle.kts` | Gradle 빌드 스크립트 (의존성, 플러그인, QueryDSL 설정) |
| `gradle/libs.versions.toml` | 버전 카탈로그 — 모든 라이브러리 버전을 한 곳에서 관리 |
| `settings.gradle.kts` | 프로젝트 이름 및 모듈 설정 |
| `gradlew` / `gradlew.bat` | Gradle Wrapper 실행 스크립트 |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `src/main/` | 애플리케이션 소스 (see `src/AGENTS.md`) |
| `src/test/` | 테스트 코드 — ArchUnit 헥사고날 검증 포함 |
| `gradle/` | Gradle Wrapper 및 버전 카탈로그 |

## For AI Agents

### Working In This Directory
- 의존성 추가 시 `gradle/libs.versions.toml` 에 버전 먼저 등록 후 `build.gradle.kts` 에서 참조
- Lombok 1.18.36 사용 중 — IDE 경고는 `jdk.java.options` javaagent 설정으로 해결
- QueryDSL Q타입은 `build/generated/querydsl/` 에 자동 생성됨 (직접 편집 금지)

### Testing Requirements
- `./gradlew test` — 전체 테스트 (JUnit5 플랫폼)
- `./gradlew bootRun --args='--spring.profiles.active=local'` — 로컬 실행 (테스트 계정 자동 생성)

### Common Patterns
- 새 기능은 반드시 헥사고날 레이어 순서로: `domain` → `application/port` → `adapter` → `application/service`
- `@UseCase` = `@Component` 메타 어노테이션 (ArchUnit 검증 대상)
- `@PersistenceAdapter` = `@Component` 메타 어노테이션

## Dependencies

### External
- Spring Boot 3.4.1, Spring Framework 6.2
- PostgreSQL 42.7.4 드라이버
- Flyway 11.1.0 — DB 마이그레이션
- jjwt 0.12.6 — JWT
- MapStruct 1.6.3 — 객체 변환
- Lombok 1.18.36 — 보일러플레이트 제거
- QueryDSL 5.1.0 — 타입 안전 쿼리
- ArchUnit 1.3.0 — 아키텍처 테스트

<!-- MANUAL: -->
