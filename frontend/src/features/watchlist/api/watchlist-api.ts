import { axiosInstance } from '@/shared/api/axios-instance'

// 사용자ID는 인증 토큰에서 식별되므로 요청에 포함하지 않는다.

/** 관심그룹 요약 (그룹명/그룹코드/관심종목수) */
export interface WatchlistGroup {
  groupName: string
  groupCode: string
  itemCount: number
}

/** 관심종목 (종목명/종목코드) */
export interface WatchlistItem {
  name: string
  symbol: string
}

/** 관심종목 조회/변경 응답 (그룹 정보 + 종목 목록) */
export interface WatchlistGroupDetail {
  groupName: string
  groupCode: string
  itemCount: number
  items: WatchlistItem[]
}

const BASE = '/api/private/watchlist'

export const watchlistApi = {
  // ─── 관심그룹 ─────────────────────────────────────────────
  /** 기본 관심그룹(코스피100/코스닥100/랜덤50) 시드 — 본인 계정에 멱등 적용 */
  seedDefaults: () =>
    axiosInstance.post<WatchlistGroup[]>(`${BASE}/seed`),

  /** 관심그룹 조회 */
  listGroups: () =>
    axiosInstance.get<WatchlistGroup[]>(`${BASE}/groups`),

  /** 관심그룹 등록 (그룹코드 자동생성) → 갱신된 그룹 목록 */
  createGroup: (groupName: string) =>
    axiosInstance.post<WatchlistGroup[]>(`${BASE}/groups`, { groupName }),

  /** 관심그룹 변경(그룹명) → 갱신된 그룹 목록 */
  renameGroup: (groupCode: string, groupName: string) =>
    axiosInstance.put<WatchlistGroup[]>(`${BASE}/groups/${groupCode}`, { groupName }),

  /** 관심그룹 삭제 → 갱신된 그룹 목록 */
  deleteGroup: (groupCode: string) =>
    axiosInstance.delete<WatchlistGroup[]>(`${BASE}/groups/${groupCode}`),

  // ─── 관심종목 ─────────────────────────────────────────────
  /** 관심종목 조회 */
  getItems: (groupCode: string) =>
    axiosInstance.get<WatchlistGroupDetail>(`${BASE}/groups/${groupCode}/items`),

  /** 관심종목 추가 (복수) → 갱신된 그룹 상세 */
  addItems: (groupCode: string, symbols: string[]) =>
    axiosInstance.post<WatchlistGroupDetail>(`${BASE}/groups/${groupCode}/items`, { symbols }),

  /** 관심종목 삭제 (복수) → 갱신된 그룹 상세 */
  removeItems: (groupCode: string, symbols: string[]) =>
    axiosInstance.delete<WatchlistGroupDetail>(`${BASE}/groups/${groupCode}/items`, { data: { symbols } }),
}
