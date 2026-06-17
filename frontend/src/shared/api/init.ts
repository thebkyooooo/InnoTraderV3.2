/**
 * axios-instance와 stomp-client에 auth-store의 getter/setter를 주입하는 모듈.
 *
 * 순환 import 방지:
 * - axios-instance / stomp-client는 auth-store를 직접 import하지 않음
 * - 이 파일에서 런타임에 주입 (registerAuthStore, registerStompAuth)
 *
 * 사용법: src/app/providers.tsx 최상단에서 한 번 호출
 *   import { initApiLayer } from '@/shared/api/init'
 *   initApiLayer()
 */

import { registerAuthStore } from './axios-instance'
import { registerStompAuth } from './stomp-client'
import { getAccessTokenFromStore, setAccessTokenInStore } from '@/store/auth-store'

let initialized = false

export function initApiLayer() {
  if (initialized) return
  initialized = true

  // axios interceptor에 auth-store 연결
  registerAuthStore(getAccessTokenFromStore, setAccessTokenInStore)

  // stomp-client에 auth-store 연결
  registerStompAuth(getAccessTokenFromStore)
}

// ─── initAxiosAuth (하위 호환) ────────────────────────────────────────────────
// providers.tsx에서 initAxiosAuth() 형태로 호출하는 경우를 위한 별칭
export { initApiLayer as initAxiosAuth }
