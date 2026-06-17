<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# backend/src/main/java/com/innotrader/user

## Purpose
사용자 도메인 — 회원가입·로그인 기능의 헥사고날 아키텍처 구현. Ports & Adapters 패턴으로 도메인 로직을 외부 의존성으로부터 격리한다.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `adapter/in/web/` | Inbound 어댑터 — REST 컨트롤러 |
| `adapter/in/web/dto/` | 요청·응답 DTO |
| `adapter/out/persistence/` | Outbound 어댑터 — JPA 영속성 |
| `application/service/` | Application Service — Use Case 구현 |
| `domain/model/` | 도메인 모델 — 엔티티, 값 객체 |
| `domain/port/in/` | Inbound 포트 — Use Case 인터페이스 |
| `domain/port/out/` | Outbound 포트 — Repository 인터페이스 |

## Key Files
| File | Description |
|------|-------------|
| `adapter/in/web/AuthController.java` | REST API — `/api/v1/auth/**` 엔드포인트 |
| `adapter/in/web/dto/LoginRequest.java` | 로그인 요청 DTO |
| `adapter/in/web/dto/RegisterRequest.java` | 회원가입 요청 DTO |
| `adapter/in/web/dto/TokenResponse.java` | accessToken + refreshToken 응답 |
| `adapter/in/web/dto/UserResponse.java` | 사용자 정보 응답 (`/me`) |
| `adapter/out/persistence/UserJpaEntity.java` | JPA 엔티티 — `users` 테이블 매핑 |
| `adapter/out/persistence/UserJpaRepository.java` | Spring Data JPA 레포지토리 |
| `adapter/out/persistence/UserPersistenceAdapter.java` | `@PersistenceAdapter` — LoadUserPort, SaveUserPort 구현 |
| `application/service/LoginService.java` | `@UseCase` — LoginUseCase 구현 |
| `application/service/RegisterUserService.java` | `@UseCase` — RegisterUserUseCase 구현 |
| `domain/model/User.java` | 사용자 도메인 엔티티 |
| `domain/model/Email.java` | 이메일 값 객체 — 유효성 검사 포함 |
| `domain/model/UserId.java` | 사용자 ID 값 객체 |
| `domain/model/UserRole.java` | 역할 enum — ADMIN, USER |
| `domain/model/UserStatus.java` | 상태 enum — ACTIVE, INACTIVE, SUSPENDED |
| `domain/port/in/LoginUseCase.java` | 로그인 인터페이스 |
| `domain/port/in/RegisterUserUseCase.java` | 회원가입 인터페이스 |
| `domain/port/out/LoadUserPort.java` | 사용자 조회 포트 |
| `domain/port/out/SaveUserPort.java` | 사용자 저장 포트 |

## For AI Agents

### Working In This Directory
- **의존성 방향**: `adapter` → `application` → `domain` (역방향 import 금지)
- 새 Use Case 추가 시: `port/in/` 인터페이스 → `service/` 구현 → `adapter/in/` 호출 순으로 작성
- `domain/model/`은 외부 프레임워크 의존 없음 — 순수 Java 객체 유지
- ArchUnit 테스트가 헥사고날 아키텍처 규칙을 검증함 — 의존성 위반 시 테스트 실패

### Common Patterns
```java
// Use Case 인터페이스 정의
public interface LoginUseCase {
    TokenResponse login(LoginCommand command);
}

// Application Service
@UseCase
@RequiredArgsConstructor
public class LoginService implements LoginUseCase {
    private final LoadUserPort loadUserPort;
    // ...
}

// Persistence Adapter
@PersistenceAdapter
@RequiredArgsConstructor
public class UserPersistenceAdapter implements LoadUserPort, SaveUserPort {
    private final UserJpaRepository repository;
    // ...
}
```

<!-- MANUAL: -->
