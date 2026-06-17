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
        // 데이터를 30초 동안 신선하다고 간주 (30초 이내 재요청 없음)
        staleTime: 30_000,
        // 캐시에서 비활성 데이터를 5분 후 제거
        gcTime: 300_000,
        // 실패 시 1회만 재시도
        retry: 1,
        // 네트워크 재연결 시 자동 refetch
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

/**
 * 실시간 데이터용 QueryClient 옵션
 * 트레이딩 페이지에서 WebSocket 데이터와 함께 사용 시
 * staleTime을 0으로 설정하여 항상 신선한 데이터 요구
 */
export const realtimeQueryOptions = {
  staleTime: 0,
  gcTime: 60_000, // 1분
  refetchInterval: false as const,
} as const

/**
 * 정적 데이터용 QueryClient 옵션
 * 종목 기본 정보, 마켓 메타데이터 등 자주 변하지 않는 데이터
 */
export const staticQueryOptions = {
  staleTime: 5 * 60_000, // 5분
  gcTime: 30 * 60_000,   // 30분
  refetchOnWindowFocus: false,
} as const
