<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# backend/src/main/java/com/innotrader/common

## Purpose
애플리케이션 공통 인프라. 보안 설정, JWT 처리, 에러 핸들링, 공용 도메인 타입, 커스텀 어노테이션을 포함한다.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `annotation/` | 헥사고날 아키텍처 마커 어노테이션 |
| `config/` | Spring 설정 — Security, Redis, WebSocket, 비동기, 로컬 초기화 |
| `domain/` | 공용 도메인 타입 — BaseEntity, Money |
| `error/` | 에러 처리 — BusinessException, ErrorCode, GlobalExceptionHandler |
| `security/` | JWT 인증 — Filter, Provider, UserDetails, RefreshTokenService |

## Key Files
| File | Description |
|------|-------------|
| `annotation/UseCase.java` | `@UseCase` — Application Service 마커 (ArchUnit 규칙 대상) |
| `annotation/PersistenceAdapter.java` | `@PersistenceAdapter` — 영속성 어댑터 마커 |
| `config/SecurityConfig.java` | Spring Security 설정 — JWT 필터, CORS, 인증 제외 경로 |
| `config/LocalDataInitializer.java` | `local` 프로파일 — 테스트 계정 자동 생성 (`test@innotrader.com` / `Test1234!`) |
| `config/RedisConfig.java` | Redis 연결 설정 — refresh token 저장소 |
| `config/WebSocketConfig.java` | STOMP WebSocket 설정 |
| `domain/Money.java` | 금액 값 객체 — BigDecimal 래퍼 |
| `domain/BaseEntity.java` | JPA 공통 필드 — createdAt, updatedAt |
| `error/ErrorCode.java` | 에러 코드 enum |
| `error/GlobalExceptionHandler.java` | `@RestControllerAdvice` — BusinessException → HTTP 응답 변환 |
| `security/JwtAuthenticationFilter.java` | OncePerRequestFilter — JWT 검증, SKIP_PATTERNS 처리 |
| `security/JwtTokenProvider.java` | JWT 생성·검증 유틸 |
| `security/RefreshTokenService.java` | Redis 기반 refresh token CRUD |

## For AI Agents

### Working In This Directory
- SKIP_PATTERNS는 정확한 경로만 포함 — `/api/v1/auth/**` 와일드카드 사용 금지 (`/me` 같은 인증 필요 엔드포인트 제외됨)
- 새 에러 코드 추가 시 `ErrorCode.java` enum에 추가
- 새 비즈니스 예외는 `BusinessException(ErrorCode)` 생성자 사용
- CORS 허용 출처는 `application.yml`의 `spring.security.cors.allowed-origins` 로 관리

### Common Patterns
```java
// 비즈니스 예외
throw new BusinessException(ErrorCode.USER_NOT_FOUND);

// 커스텀 어노테이션
@UseCase          // Application Service 클래스에
@PersistenceAdapter  // 영속성 어댑터 클래스에
```

<!-- MANUAL: -->
