import { axiosInstance } from '@/shared/api/axios-instance'

// 사용자ID는 인증 토큰에서 식별되므로 요청에 포함하지 않는다.

/** 보유종목 (종목명/종목코드/보유수량/평균단가/현재가/평가금액/수익금/수익률) */
export interface HoldingItem {
  name: string
  symbol: string
  quantity: number
  avgPrice: number
  currentPrice: number
  evalAmount: number
  profit: number
  profitRate: number
}

/** 잔고 요약 (총자산/총평가금액/원금/총수익금/총수익률) */
export interface HoldingSummary {
  totalAssets: number
  totalEvalAmount: number
  principal: number
  totalProfit: number
  totalProfitRate: number
}

/** 주식잔고 조회 응답 (요약 + 목록) */
export interface HoldingsResponse {
  summary: HoldingSummary
  items: HoldingItem[]
}

const BASE = '/api/private/holdings'

export const holdingApi = {
  /** 주식잔고 조회 */
  getHoldings: (accountNo: string) =>
    axiosInstance.get<HoldingsResponse>(`${BASE}/holdings`, { params: { accountNo } }),

  /** 계좌별 보유종목 시드 (멱등) */
  seedDefaults: () =>
    axiosInstance.post<void>(`${BASE}/seed`),
}
