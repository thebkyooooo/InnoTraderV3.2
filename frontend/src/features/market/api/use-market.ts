'use client'
import { useQuery } from '@tanstack/react-query'
import { marketApi, type IndexInfo, type ExchangeRate, type StockRanking, type MarketType } from './market-api'

export type RankingType = 'market-cap' | 'volume' | 'advancing' | 'declining' | 'gap-up' | 'overheated'

// 시장 정보 React Query 훅. 공개 API라 인증 가드(enabled)는 불필요하다.

/** 글로벌 지수 조회 */
export function useMarketIndex() {
  return useQuery<IndexInfo[]>({
    queryKey: ['market', 'index'],
    queryFn: async () => (await marketApi.getIndex()).data,
  })
}

/** 환율 조회 */
export function useExchangeRates() {
  return useQuery<ExchangeRate[]>({
    queryKey: ['market', 'exchange'],
    queryFn: async () => (await marketApi.getExchange()).data,
  })
}

/** 시가총액 상위 */
export function useMarketCapRanking(market: MarketType) {
  return useQuery<StockRanking[]>({
    queryKey: ['market', 'market-cap', market],
    queryFn: async () => (await marketApi.getMarketCapRanking(market)).data,
  })
}

/** 거래량 상위 */
export function useVolumeRanking(market: MarketType) {
  return useQuery<StockRanking[]>({
    queryKey: ['market', 'volume', market],
    queryFn: async () => (await marketApi.getVolumeRanking(market)).data,
  })
}

/** 상승 종목 */
export function useAdvancing(market: MarketType) {
  return useQuery<StockRanking[]>({
    queryKey: ['market', 'advancing', market],
    queryFn: async () => (await marketApi.getAdvancing(market)).data,
  })
}

/** 하락 종목 */
export function useDeclining(market: MarketType) {
  return useQuery<StockRanking[]>({
    queryKey: ['market', 'declining', market],
    queryFn: async () => (await marketApi.getDeclining(market)).data,
  })
}

/** 갭상승 종목 */
export function useGapUp(market: MarketType) {
  return useQuery<StockRanking[]>({
    queryKey: ['market', 'gap-up', market],
    queryFn: async () => (await marketApi.getGapUp(market)).data,
  })
}

/** 투자심리과열 종목 */
export function useOverheated(market: MarketType) {
  return useQuery<StockRanking[]>({
    queryKey: ['market', 'overheated', market],
    queryFn: async () => (await marketApi.getOverheated(market)).data,
  })
}

/** 인기검색 종목 (상위 10) */
export function useTrending() {
  return useQuery<StockRanking[]>({
    queryKey: ['market', 'trending'],
    queryFn: async () => (await marketApi.getTrending()).data,
  })
}

/** 시장랭킹 — 조회구분별 통합 훅 (Rules of Hooks 준수) */
export function useRanking(rankingType: RankingType, market: MarketType) {
  return useQuery<StockRanking[]>({
    queryKey: ['market', 'ranking', rankingType, market],
    queryFn: async () => {
      switch (rankingType) {
        case 'market-cap': return (await marketApi.getMarketCapRanking(market)).data
        case 'volume':     return (await marketApi.getVolumeRanking(market)).data
        case 'advancing':  return (await marketApi.getAdvancing(market)).data
        case 'declining':  return (await marketApi.getDeclining(market)).data
        case 'gap-up':     return (await marketApi.getGapUp(market)).data
        case 'overheated': return (await marketApi.getOverheated(market)).data
      }
    },
  })
}
