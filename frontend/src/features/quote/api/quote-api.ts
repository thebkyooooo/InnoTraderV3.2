import { axiosInstance } from '@/shared/api/axios-instance'

export interface QuotePriceResponse {
  symbol: string
  name: string
  market: string
  price: number
  prevDiff: number
  change: number
  volume: number
  open: number
  high: number
  low: number
  prevClose: number
  upperLimit: number
  lowerLimit: number
  tradingAmount: number
}

export interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasNext: boolean
}

export interface DailyQuoteItem {
  date: string        // "20241215"
  price: number
  prevDiff: number
  change: number
  open: number
  high: number
  low: number
  volume: number
  turnoverMan: number
}

export interface FilledQuoteItem {
  time: string        // "093000"
  price: number
  prevDiff: number
  change: number
  askPrice: number
  bidPrice: number
  filledVolume: number
  fillStrength: number
  volume: number      // 누적거래량
}

export interface InvestmentTrendItem {
  date: string
  price: number
  prevDiff: number
  change: number
  volume: number
  foreign: number
  individual: number
  institution: number
}

export interface QuoteDetailItem {
  name: string
  symbol: string
  marketCap: number   // 만원 단위
  lstdShrs: number
  parValue: number
  upperLimit: number
  lowerLimit: number
  high52w: number
  low52w: number
  per: number
  eps: number
  pbr: number
  bps: number
}

export interface DailyChartBar {
  date: string        // "20241215"
  open: number
  high: number
  low: number
  price: number       // close
  volume: number
}

export interface TimeChartBar {
  time: string        // "093000"
  open: number
  high: number
  low: number
  price: number       // close
  filledVolume: number
}

export interface HogaEntry {
  price: number
  volume: number
}

export interface HogaData {
  asks: HogaEntry[]  // 매도호가 (낮은→높은, 매도1~매도10)
  bids: HogaEntry[]  // 매수호가 (높은→낮은, 매수1~매수10)
}

export type DailyChartType = 'D' | 'W' | 'M' | 'Y'

export const quoteApi = {
  getPrice: (symbol: string) =>
    axiosInstance.get<QuotePriceResponse>('/api/public/quotes/price', { params: { symbol } }),

  getDaily: (symbol: string, size = 100, cursor?: string) =>
    axiosInstance.get<PageResult<DailyQuoteItem>>('/api/public/quotes/daily', {
      params: { symbol, size, ...(cursor ? { cursor } : {}) },
    }),

  getFilled: (symbol: string, size = 100, cursor?: string) =>
    axiosInstance.get<PageResult<FilledQuoteItem>>('/api/public/quotes/filled', {
      params: { symbol, size, ...(cursor ? { cursor } : {}) },
    }),

  getTrends: (symbol: string, size = 100, cursor?: string) =>
    axiosInstance.get<PageResult<InvestmentTrendItem>>('/api/public/quotes/trends', {
      params: { symbol, size, ...(cursor ? { cursor } : {}) },
    }),

  getDetail: (symbol: string) =>
    axiosInstance.get<QuoteDetailItem>('/api/public/quotes/detail', { params: { symbol } }),

  getHoga: (symbol: string) =>
    axiosInstance.get<HogaData>('/api/public/quotes/hoga', { params: { symbol } }),

  getChartDaily: (symbol: string, type: DailyChartType, size = 360, cursor?: string) =>
    axiosInstance.get<PageResult<DailyChartBar>>('/api/public/chart/daily', {
      params: { symbol, type, size, ...(cursor ? { cursor } : {}) },
    }),

  getChartTime: (symbol: string, type: number, size = 360, cursor?: string) =>
    axiosInstance.get<PageResult<TimeChartBar>>('/api/public/chart/time', {
      params: { symbol, type, size, ...(cursor ? { cursor } : {}) },
    }),
}
