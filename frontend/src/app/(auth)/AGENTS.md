<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# frontend/src/app/(auth)

## Purpose
인증 라우트 그룹. 로그인·회원가입 페이지를 중앙 정렬 레이아웃으로 감싼다. URL에 `(auth)` 세그먼트는 포함되지 않는다.

## Key Files
| File | Description |
|------|-------------|
| `layout.tsx` | 인증 공통 레이아웃 — 중앙 정렬, InnoTrader 로고, 최대 너비 320px |
| `login/page.tsx` | `/login` 페이지 — `<LoginForm />` 렌더링 |
| `register/page.tsx` | `/register` 페이지 — `<RegisterForm />` 렌더링 |

## For AI Agents

### Working In This Directory
- `layout.tsx`는 서버 컴포넌트 — `metadata` export 포함
- 폼 컴포넌트(`LoginForm`, `RegisterForm`)는 `features/auth/components/`에 위치
- 이 그룹의 페이지는 미들웨어에서 인증 없이 접근 가능 (public routes)
- 새 인증 관련 페이지(비밀번호 찾기 등) 추가 시 이 그룹 하위에 배치

### URL 구조
| URL | 파일 경로 |
|-----|---------|
| `/login` | `login/page.tsx` |
| `/register` | `register/page.tsx` |

<!-- MANUAL: -->
