<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# common/security

## Purpose
JWT 기반 인증 인프라. 요청별 토큰 검증 필터, JWT 생성·파싱 유틸, Spring Security UserDetails 구현, Redis 기반 refresh token 관리를 포함한다.

## Key Files
| File | Description |
|------|-------------|
| `JwtAuthenticationFilter.java` | OncePerRequestFilter — 요청마다 Authorization 헤더에서 JWT 추출·검증, SecurityContext 설정 |
| `JwtTokenProvider.java` | JWT 생성(access/refresh), 파싱, 유효성 검사 — `application.yml`의 `jwt.secret` 사용 |
| `JwtUserDetails.java` | Spring Security `UserDetails` 구현 — userId, email, role 포함 |
| `RefreshTokenService.java` | Redis CRUD — refresh token 저장(TTL), 조회, 삭제 |

## For AI Agents

### Working In This Directory
- `SKIP_PATTERNS`은 정확한 경로 문자열 배열로 관리 — 와일드카드(`**`) 사용 금지
  - 잘못된 예: `"/api/v1/auth/**"` → `/me` 같은 인증 필요 경로까지 스킵됨
  - 올바른 예: `"/api/v1/auth/login"`, `"/api/v1/auth/register"`, ...
- access token TTL은 `application.yml`의 `jwt.access-token-expiration`으로 설정
- refresh token은 Redis에 `refreshToken:{userId}` 키로 저장
- `JwtUserDetails`는 `Principal`로 컨트롤러에서 `@AuthenticationPrincipal JwtUserDetails user`로 주입

### Common Patterns
```java
// 컨트롤러에서 현재 사용자 접근
@GetMapping("/me")
public UserResponse getMe(@AuthenticationPrincipal JwtUserDetails user) {
    return userQueryService.getUser(user.getUserId());
}
```

<!-- MANUAL: -->
