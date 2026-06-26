import { axiosInstance } from '@/shared/api/axios-instance'

// 시장 정보 공개 API — 백엔드 com.innotrader.market 미러링. 인증 불필요.

/** 글로벌 지수 (지수명/지수/등락률/전일대비) */
export interface IndexInfo {
  code: string       // 지수코드 (KS11, KQ11, DJI ...)
  name: string       // 지수명 (코스피, 코스닥 ...)
  price: number      // 지수
  prevDiff: number   // 전일대비
  change: number     // 등락률(%)
}

/** 환율 (환율명/국가/환율/등락률/전일대비) */
export interface ExchangeRate {
  pair: string       // 환율명 (USD/KRW ...)
  name: string       // 국가/통화명
  rate: number       // 환율
  prevDiff: number   // 전일대비
  change: number     // 등락률(%)
}

/** 종목 랭킹 (시가총액/거래량/상승/하락/갭상승/과열/인기검색 공용) */
export interface StockRanking {
  rank: number
  symbol: string
  name: string
  market: string       // KOSPI, KOSDAQ
  price: number
  prevDiff: number
  change: number       // 등락률(%)
  marketCap?: number   // 시가총액상위 전용
  volume?: number      // 거래량상위 전용
  tradingAmount?: number // 거래대금상위 전용
}

/** 시장 구분 */
export type MarketType = 'KOSPI' | 'KOSDAQ' | 'ALL'

const BASE = '/api/public/market'

export const marketApi = {
  /** 글로벌 지수 조회 */
  getIndex: () => axiosInstance.get<IndexInfo[]>(`${BASE}/index`),

  /** 환율 조회 */
  getExchange: () => axiosInstance.get<ExchangeRate[]>(`${BASE}/exchange`),

  /** 시가총액 상위 */
  getMarketCapRanking: (market: MarketType) =>
    axiosInstance.get<StockRanking[]>(`${BASE}/ranking/market-cap`, { params: { market } }),

  /** 거래량 상위 */
  getVolumeRanking: (market: MarketType) =>
    axiosInstance.get<StockRanking[]>(`${BASE}/ranking/volume`, { params: { market } }),

  /** 상승 종목 */
  getAdvancing: (market: MarketType) =>
    axiosInstance.get<StockRanking[]>(`${BASE}/advancing`, { params: { market } }),

  /** 하락 종목 */
  getDeclining: (market: MarketType) =>
    axiosInstance.get<StockRanking[]>(`${BASE}/declining`, { params: { market } }),

  /** 갭상승 종목 */
  getGapUp: (market: MarketType) =>
    axiosInstance.get<StockRanking[]>(`${BASE}/gap-up`, { params: { market } }),

  /** 투자심리과열 종목 */
  getOverheated: (market: MarketType) =>
    axiosInstance.get<StockRanking[]>(`${BASE}/overheated`, { params: { market } }),

  /** 인기검색 종목 (상위 10) */
  getTrending: () => axiosInstance.get<StockRanking[]>(`${BASE}/trending`),
}
