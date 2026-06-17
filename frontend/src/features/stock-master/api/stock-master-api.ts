import { axiosInstance } from '@/shared/api/axios-instance'

export interface StockSummary {
  name: string
  symbol: string
  market: string
}

export const stockMasterApi = {
  getStocks: (market?: 'ALL' | 'KOSPI' | 'KOSDAQ') =>
    axiosInstance.get<StockSummary[]>('/api/public/master/stocks', {
      params: market ? { market } : undefined,
    }),
}
