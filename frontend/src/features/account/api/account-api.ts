import { axiosInstance } from '@/shared/api/axios-instance'

// 사용자ID는 인증 토큰에서 식별되므로 요청에 포함하지 않는다.

/** 계좌목록 항목 (계좌번호/계좌명/계좌유형코드/계좌유형) */
export interface Account {
  accountNo: string
  accountName: string
  typeCode: string
  typeName: string
}

/** 주문가능금액 응답 */
export interface OrderableAmount {
  accountNo: string
  orderableAmount: number
}

/** 주문가능수량 응답 */
export interface OrderableShares {
  accountNo: string
  symbol: string
  name: string
  orderableShares: number
}

const BASE = '/api/private/accounts'

export const accountApi = {
  /** 계좌목록 조회 */
  getAccountList: () =>
    axiosInstance.get<Account[]>(`${BASE}/accountlist`),

  /** 주문가능금액 조회 */
  getOrderableAmount: (accountNo: string) =>
    axiosInstance.get<OrderableAmount>(`${BASE}/amount`, { params: { accountNo } }),

  /** 주문가능수량 조회 */
  getOrderableShares: (accountNo: string, symbol: string) =>
    axiosInstance.get<OrderableShares>(`${BASE}/shares`, { params: { accountNo, symbol } }),

  /** 기본 계좌 시드 (멱등) */
  seedDefaults: () =>
    axiosInstance.post<Account[]>(`${BASE}/seed`),
}
