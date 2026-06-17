<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# frontend/src/shared/api

## Purpose
HTTP 클라이언트 인프라 및 WebSocket 클라이언트. axios 인스턴스·interceptor, STOMP 클라이언트, Orval 자동 생성 코드를 포함한다.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `generated/endpoints/` | Orval로 자동 생성된 API 함수 |
| `generated/model/` | Orval로 자동 생성된 타입 정의 |

## Key Files
| File | Description |
|------|-------------|
| `axios-instance.ts` | axios 싱글톤 — baseURL, 인증 헤더, 401 interceptor (토큰 재발급) |
| `init.ts` | API 레이어 초기화 — auth-store를 axios/stomp에 런타임 주입 (순환 import 방지) |
| `stomp-client.ts` | STOMP over WebSocket 클라이언트 — 실시간 호가/체결 수신 |

## For AI Agents

### Working In This Directory
- **순환 import 방지 패턴**: `axios-instance`와 `stomp-client`는 `auth-store`를 직접 import하지 않음. `init.ts`의 `initApiLayer()`가 런타임에 getter/setter를 주입
- `initApiLayer()`는 `src/app/providers.tsx` 에서 앱 마운트 시 1회 호출됨
- 401 응답 시 interceptor가 `/api/v1/auth/refresh`를 호출해 access token 갱신 후 원 요청 재시도
- `generated/` 하위는 Orval CLI로 자동 생성 — 직접 수정 금지

### Common Patterns
```typescript
// axios 인스턴스 사용
import { axiosInstance } from '@/shared/api/axios-instance'
const data = await axiosInstance.get('/api/v1/some-endpoint')

// STOMP 구독
import { stompClient } from '@/shared/api/stomp-client'
stompClient.subscribe('/topic/orderbook/AAPL', (msg) => { ... })
```

<!-- MANUAL: -->
