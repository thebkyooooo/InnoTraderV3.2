import { axiosInstance } from '@/shared/api/axios-instance'

// 계좌주문 API — 백엔드 com.innotrader.order 미러링.
// 사용자ID는 인증 토큰에서 식별되므로 요청에 포함하지 않는다.

export type OrderSideCode = 'buy' | 'sell'
export type OrderTypeCode = 'MARKET' | 'LIMIT'
export type OrderStatusCode =
  | 'RECEIVED' | 'PARTIAL' | 'FILLED' | 'CANCELED' | 'AMENDED' | 'CANCEL_DONE'

/** 주문내역 주문구분 필터 */
export type SideFilter = 'ALL' | 'BUY' | 'SELL'
/** 주문내역 체결구분 필터 */
export type FillFilter = 'ALL' | 'FILLED' | 'UNFILLED'

// ── 요청 ─────────────────────────────────────────────────────────────────────
/** 매수/매도 주문 요청 (주문구분은 엔드포인트로 결정) */
export interface PlaceOrderRequest {
  accountNo: string
  symbol: string
  orderType: OrderTypeCode
  quantity: number
  price: number
}

/** 정정 주문 요청 (quantity=정정수량, price=정정가격) */
export interface AmendOrderRequest {
  accountNo: string
  symbol: string
  originalOrderNo: string
  orderType: OrderTypeCode
  quantity: number
  price: number
}

/** 취소 주문 요청 */
export interface CancelOrderRequest {
  accountNo: string
  symbol: string
  originalOrderNo: string
}

/** 주문내역 조회 조건 */
export interface OrderHistoryParams {
  accountNo: string
  side?: SideFilter
  fill?: FillFilter
  symbol?: string
  /** 조회 시작일 (YYYY-MM-DD, inclusive) */
  startDate?: string
  /** 조회 종료일 (YYYY-MM-DD, inclusive) */
  endDate?: string
}

// ── 응답 ─────────────────────────────────────────────────────────────────────
/** 매수/매도 주문 응답 */
export interface OrderResponse {
  accountNo: string
  orderNo: string
  symbol: string
  side: OrderSideCode
  sideName: string
  orderType: OrderTypeCode
  orderTypeName: string
  quantity: number
  price: number
  status: OrderStatusCode
  statusName: string
  filledQuantity: number
  orderedAt: string
}

/** 정정 주문 응답 */
export interface AmendResponse {
  accountNo: string
  orderNo: string
  originalOrderNo: string
  symbol: string
  orderType: OrderTypeCode
  orderTypeName: string
  quantity: number
  price: number
  status: OrderStatusCode
  statusName: string
  orderedAt: string
}

/** 취소 주문 응답 */
export interface CancelResponse {
  accountNo: string
  orderNo: string
  originalOrderNo: string
  symbol: string
  cancelQuantity: number
  status: OrderStatusCode
  statusName: string
  orderedAt: string
}

/** 주문내역 요약 (총주문/총체결/총미체결/총취소 수량, 총체결금액) */
export interface OrderHistorySummary {
  totalQuantity: number
  totalFilledQuantity: number
  totalUnfilledQuantity: number
  totalCanceledQuantity: number
  totalFilledAmount: number
}

/** 주문내역 항목 */
export interface OrderHistoryItem {
  orderDate: string
  orderTime: string
  name: string
  symbol: string
  quantity: number
  price: number
  orderAmount: number
  filledQuantity: number
  filledPrice: number
  side: OrderSideCode
  sideName: string
  orderType: OrderTypeCode
  orderTypeName: string
  status: OrderStatusCode
  statusName: string
  orderNo: string
  orderedAt: string
}

/** 주문내역 조회 응답 (요약 + 목록) */
export interface OrderHistoryResponse {
  summary: OrderHistorySummary
  items: OrderHistoryItem[]
}

const BASE = '/api/private/order'

export const orderApi = {
  /** 매수 주문 */
  buy: (req: PlaceOrderRequest) =>
    axiosInstance.post<OrderResponse>(`${BASE}/buy`, req),

  /** 매도 주문 */
  sell: (req: PlaceOrderRequest) =>
    axiosInstance.post<OrderResponse>(`${BASE}/sell`, req),

  /** 정정 주문 */
  amend: (req: AmendOrderRequest) =>
    axiosInstance.post<AmendResponse>(`${BASE}/amend`, req),

  /** 취소 주문 */
  cancel: (req: CancelOrderRequest) =>
    axiosInstance.post<CancelResponse>(`${BASE}/cancel`, req),

  /** 주문내역 조회 */
  getHistory: (params: OrderHistoryParams) =>
    axiosInstance.get<OrderHistoryResponse>(`${BASE}/history`, { params }),

  /** 계좌별 주문내역 시드 (멱등) */
  seedDefaults: () =>
    axiosInstance.post<void>(`${BASE}/seed`),
}
