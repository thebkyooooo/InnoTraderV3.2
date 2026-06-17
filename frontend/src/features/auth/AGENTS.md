<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# frontend/src/features/auth

## Purpose
인증 도메인 기능 모듈. 로그인·회원가입 API 호출, 폼 UI 컴포넌트, Zod 유효성 검사 스키마를 포함한다.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `api/` | API 함수 + TanStack Query 훅 |
| `components/` | 폼 및 버튼 컴포넌트 |
| `schema/` | Zod 유효성 검사 스키마 |

## Key Files
| File | Description |
|------|-------------|
| `api/auth-api.ts` | 순수 API 함수 — login, register, logout, getMe (axios 직접 호출) |
| `api/use-auth.ts` | TanStack Query 훅 — `useLogin`, `useRegister`, `useLogout`, `useMe` |
| `components/LoginForm.tsx` | 로그인 폼 — react-hook-form + Zod, auth_session 쿠키 설정 |
| `components/RegisterForm.tsx` | 회원가입 폼 — react-hook-form + Zod |
| `components/LogoutButton.tsx` | 사이드바 하단 사용자 정보 + 로그아웃 버튼 |
| `schema/auth-schema.ts` | loginSchema, registerSchema Zod 정의 |

## For AI Agents

### Working In This Directory
- `useLogin` 성공 시: Zustand auth store 갱신 + `auth_session` 쿠키 설정 (미들웨어 인증용)
- `useLogout` 완료 시: auth store 초기화 + `auth_session` 쿠키 삭제 + `/login` 리다이렉트
- `auth_session` 쿠키는 프론트엔드 도메인(`localhost:3000`)에서 설정 — 백엔드 쿠키가 아님
- API 함수와 훅은 반드시 분리 유지 (`auth-api.ts` → 순수 함수, `use-auth.ts` → 훅)

### Common Patterns
```typescript
// 훅 사용 예시
const { mutate: login, isPending } = useLogin()
login({ email, password }, {
  onSuccess: () => router.push('/dashboard'),
  onError: (err) => setError(err.message),
})
```

### Dependencies
- `@/store/auth-store` — accessToken, user 상태 저장
- `@/shared/api/axios-instance` — HTTP 클라이언트

<!-- MANUAL: -->
