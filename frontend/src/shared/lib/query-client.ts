import { QueryClient } from '@tanstack/react-query'

/**
 * TanStack Query QueryClient 팩토리
 *
 * SSR 친화적 설계:
 * - 서버 환경에서는 요청마다 새 인스턴스 생성 (상태 공유 방지)
 * - 클라이언트 환경에서는 싱글톤 유지 (providers.tsx에서 관리)
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // staleTime 0: 데이터를 항상 stale로 간주 → 마운트/화면이동/재진입/조회/
        // 새로고침/포커스 등 이벤트마다 항상 최신을 재조회한다(캐시로 스킵하지 않음
        // → 데이터 누락 방지). 단, 같은 키의 "동시(in-flight) 요청"은 React Query가
        // 자동으로 1건으로 합치므로(StrictMode 이중 실행 포함) 중복 호출은 발생하지 않는다.
        staleTime: 0,
        // 캐시에서 비활성 데이터를 5분 후 제거
        gcTime: 300_000,
        // 실패 시 1회만 재시도
        retry: 1,
        // 창 포커스/네트워크 재연결 시 자동 refetch
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        // 뮤테이션 실패 시 재시도 없음 (중복 주문 방지)
        retry: 0,
      },
    },
  })
}
