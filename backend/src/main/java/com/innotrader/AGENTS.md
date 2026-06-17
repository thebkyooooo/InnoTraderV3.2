<!-- Parent: ../../java/AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# com.innotrader (루트 패키지)

## Purpose
InnoTrader 애플리케이션 루트 패키지. 공통 인프라(`common`)와 사용자 도메인(`user`)으로 구성된 헥사고날 아키텍처 구조를 갖는다.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `common/` | 공통 인프라 — Security, JWT, 에러 처리, 공용 타입 (see `common/AGENTS.md`) |
| `user/` | 사용자 도메인 — 회원가입·로그인 헥사고날 구현 (see `user/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- 새 도메인 추가 시 `{domain}/` 패키지 생성 후 adapter/application/domain 구조 준수
- 도메인 간 직접 import 지양 — 공유 타입은 `common/domain/`으로 이동
- ArchUnit 테스트가 패키지 의존성 규칙을 검증

<!-- MANUAL: -->
