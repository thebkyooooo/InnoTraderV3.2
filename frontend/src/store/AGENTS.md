<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# frontend/src/store

## Purpose
Zustand 전역 클라이언트 상태 저장소. 인증 상태(Access Token, 유저 정보)와 UI 상태(테마)를 관리한다.

## Key Files
| File | Description |
|------|-------------|
| `auth-store.ts` | 인증 상태 — accessToken(메모리), user, isAuthenticated + axios interceptor용 헬퍼 |
| `ui-store.ts` | UI 상태 — 테마(dark/light) |

## For AI Agents

### Working In This Directory
- `accessToken` 은 메모리에만 저장 — XSS 방어를 위해 localStorage/cookie 저장 금지
- `persist` 없음 — 새로고침 시 refresh token 쿠키로 자동 재발급 (axios interceptor 처리)
- 컴포넌트 외부(axios interceptor)에서 store 접근 시 `getAccessTokenFromStore()`, `setAccessTokenInStore()` 사용

### Common Patterns
```typescript
// 컴포넌트 내부
const { accessToken, setUser } = useAuthStore()

// 컴포넌트 외부 (axios interceptor 등)
import { getAccessTokenFromStore } from '@/store/auth-store'
const token = getAccessTokenFromStore()
```

<!-- MANUAL: -->
