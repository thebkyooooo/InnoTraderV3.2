<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# frontend/src/app/(trading)

## Purpose
트레이딩 라우트 그룹. 종목별 실시간 거래 화면을 제공한다. 동적 라우트(`[symbol]`)로 종목 코드를 URL 파라미터로 받는다.

## Key Files
| File | Description |
|------|-------------|
| `trade/[symbol]/page.tsx` | `/trade/{symbol}` 거래 페이지 — 종목별 호가·차트·주문 폼 |

## For AI Agents

### Working In This Directory
- `[symbol]` 파라미터는 종목 코드 (예: `/trade/AAPL`, `/trade/005930`)
- 실시간 호가 수신은 `shared/api/stomp-client.ts` 의 STOMP WebSocket 사용
- 미들웨어 `PROTECTED_PATHS`에 `/trade` 포함 — 인증 필수

### URL 구조
| URL | 파일 경로 |
|-----|---------|
| `/trade/{symbol}` | `trade/[symbol]/page.tsx` |

<!-- MANUAL: -->
