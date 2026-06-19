import { axiosInstance } from '@/shared/api/axios-instance'

export interface StockSummary {
  name: string
  symbol: string
  market: string
}

/** 종목 상세 시세 (복수종목 시세 조회 응답) */
export interface StockQuote {
  name: string
  symbol: string
  market: string
  price: number        // 종가
  prevDiff: number     // 전일대비
  change: number       // 등락률(%)
  open: number         // 시가
  high: number         // 고가
  low: number          // 저가
  volume: number       // 거래량
  turnoverMan: number  // 거래금액(만)
}

export const stockMasterApi = {
  getStocks: (market?: 'ALL' | 'KOSPI' | 'KOSDAQ') =>
    axiosInstance.get<StockSummary[]>('/api/public/master/stocks', {
      params: market ? { market } : undefined,
    }),

  /** 복수종목 시세 조회 */
  getBatch: (symbols: string[]) =>
    axiosInstance.get<StockQuote[]>('/api/public/master/stocks/batch', {
      params: { symbols: symbols.join(',') },
    }),
}
