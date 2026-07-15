'use client'
import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import type { ColDef, ValueFormatterParams } from 'ag-grid-community'
import { SegmentedControl, Button, DataGrid, Section } from '@/components/ui'
import { DragScroll } from '@/components/ui/DragScroll'
import { useRanking, type RankingType } from '@/features/market/api/use-market'
import type { StockRanking } from '@/features/market/api/market-api'
import type { MarketType } from '@/features/market/api/market-api'
import { useStockPricesWS } from '@/features/quote/api/use-quote-ws'
import { StockSidePanel } from '@/components/quote'

// ─── 포매터 ────────────────────────────────────────────────────────────────────

const fmtNumber = (v: number | null | undefined) =>
  v == null ? '-' : v.toLocaleString('ko-KR')

const fmtChange = (v: number) => {
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toFixed(1)}%`
}

const fmtPrevDiff = (v: number) => {
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toLocaleString('ko-KR')}`
}

// marketCap: 억원 단위 (stock-master.json 기준)
const fmtMarketCap = (v: number | null | undefined) => {
  if (v == null) return '-'
  return v.toLocaleString('ko-KR') + '억'
}

// tradingAmount: 만원 단위 (turnoverMan = volume * price / 10_000)
const fmtTradingAmount = (v: number | null | undefined) => {
  if (v == null) return '-'
  const uk = Math.round(v / 10000)
  return uk.toLocaleString('ko-KR') + '억'
}

const changeStyle = (v: number): React.CSSProperties => ({
  color: v > 0 ? '#e53e3e' : v < 0 ? '#3182ce' : 'inherit',
  fontWeight: v !== 0 ? 600 : undefined,
})

// ─── 조회구분 목록 ─────────────────────────────────────────────────────────────

const RANK_TYPES: { label: string; value: RankingType }[] = [
  { label: '시가총액', value: 'market-cap' },
  { label: '거래량',   value: 'volume' },
  { label: '상승',     value: 'advancing' },
  { label: '하락',     value: 'declining' },
  { label: '갭상승',   value: 'gap-up' },
  { label: '투자심리과열', value: 'overheated' },
]
const RANK_TYPE_VALUES = new Set(RANK_TYPES.map((t) => t.value))
const MARKET_SEGMENTS = new Set(['all', 'kospi', 'kosdaq'])

/** ?type=&market= 쿼리 파라미터로 진입 시 해당 탭/시장구분으로 초기화 (대시보드 "더보기" 연동). */
function readRankType(v: string | null): RankingType {
  return v && RANK_TYPE_VALUES.has(v as RankingType) ? (v as RankingType) : 'market-cap'
}
function readMarketSeg(v: string | null): 'all' | 'kospi' | 'kosdaq' {
  return v && MARKET_SEGMENTS.has(v) ? (v as 'all' | 'kospi' | 'kosdaq') : 'all'
}

// ─── 컬럼 정의 ─────────────────────────────────────────────────────────────────

const COL_DEFS: ColDef<StockRanking>[] = [
  {
    headerName: '순위',
    field: 'rank',
    width: 60,
    sortable: false,
    cellStyle: { textAlign: 'center', color: '#888' },
  },
  {
    headerName: '종목명',
    field: 'name',
    flex: 1,
    minWidth: 160,
  },
  {
    headerName: '현재가',
    field: 'price',
    width: 120,
    type: 'numericColumn',
    cellStyle: { textAlign: 'right' },
    valueFormatter: (p: ValueFormatterParams<StockRanking>) => fmtNumber(p.value),
  },
  {
    headerName: '전일대비',
    field: 'prevDiff',
    width: 100,
    type: 'numericColumn',
    cellStyle: (p) => ({ textAlign: 'right', ...changeStyle(p.value ?? 0) }),
    valueFormatter: (p: ValueFormatterParams<StockRanking>) => fmtPrevDiff(p.value ?? 0),
  },
  {
    headerName: '등락률',
    field: 'change',
    width: 100,
    type: 'numericColumn',
    cellStyle: (p) => ({ textAlign: 'right', ...changeStyle(p.value ?? 0) }),
    valueFormatter: (p: ValueFormatterParams<StockRanking>) => fmtChange(p.value ?? 0),
  },
  {
    headerName: '거래량',
    field: 'volume',
    width: 130,
    type: 'numericColumn',
    cellStyle: { textAlign: 'right' },
    valueFormatter: (p: ValueFormatterParams<StockRanking>) => fmtNumber(p.value),
  },
  {
    headerName: '거래대금',
    field: 'tradingAmount',
    width: 130,
    type: 'numericColumn',
    cellStyle: { textAlign: 'right' },
    valueFormatter: (p: ValueFormatterParams<StockRanking>) => fmtTradingAmount(p.value),
  },
  {
    headerName: '시가총액',
    field: 'marketCap',
    width: 130,
    type: 'numericColumn',
    cellStyle: { textAlign: 'right' },
    valueFormatter: (p: ValueFormatterParams<StockRanking>) => fmtMarketCap(p.value),
  },
  {
    headerName: '시장구분',
    field: 'market',
    width: 90,
    cellStyle: { textAlign: 'center' },
  },
]

// ─── 페이지 ────────────────────────────────────────────────────────────────────

export default function MarketRankingPage() {
  const searchParams = useSearchParams()
  const [marketSeg, setMarketSeg] = useState<'all' | 'kospi' | 'kosdaq'>(() => readMarketSeg(searchParams.get('market')))
  const [rankType, setRankType] = useState<RankingType>(() => readRankType(searchParams.get('type')))
  const [panelOpen, setPanelOpen] = useState(true)
  const [selectedStock, setSelectedStock] = useState<StockRanking | null>(null)

  const marketType = useMemo<MarketType>(() => {
    if (marketSeg === 'kospi')  return 'KOSPI'
    if (marketSeg === 'kosdaq') return 'KOSDAQ'
    return 'ALL'
  }, [marketSeg])

  const { data = [], isFetching } = useRanking(rankType, marketType)

  // 실시간 현재가/등락 병합 (2초마다 갱신) — HTTP 랭킹 스냅샷 순서는 유지한 채 값만 갱신
  const symbols = useMemo(() => data.map((r) => r.symbol), [data])
  const liveQuotes = useStockPricesWS(symbols)
  const rows = useMemo(() => data.map((r) => {
    const live = liveQuotes[r.symbol]
    if (!live) return r
    return {
      ...r,
      price: live.price, prevDiff: live.prevDiff, change: live.change,
      volume: live.volume, tradingAmount: live.tradingAmount,
    }
  }), [data, liveQuotes])

  // 랭킹 목록(구분/시장)이 바뀌면 선택 종목을 첫 종목으로 맞춘다(없으면 해제)
  useEffect(() => {
    setSelectedStock(prev => {
      if (prev && rows.some(r => r.symbol === prev.symbol)) return prev
      return rows[0] ?? null
    })
  }, [rows])

  // 사이드 패널 상단 현재가 실시간 반영 — rows(WS 병합본)에서 같은 심볼을 매 렌더 조회
  const displayStock = useMemo(() => {
    if (!selectedStock) return null
    return rows.find(r => r.symbol === selectedStock.symbol) ?? selectedStock
  }, [rows, selectedStock])

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 w-full h-full relative">
      <div className="flex-1 flex flex-col gap-4 min-w-0 sm:p-6">
        <div className="flex flex-row gap-4">
          <div>
            <SegmentedControl
              value={marketSeg}
              onChange={(v) => setMarketSeg(v as typeof marketSeg)}
              options={[
                { label: '전체',   value: 'all' },
                { label: '코스피', value: 'kospi' },
                { label: '코스닥', value: 'kosdaq' },
              ]}
              size="small"
              sx={{ whiteSpace: 'nowrap' }}
            />
          </div>

          <DragScroll className="flex w-full rounded-lg">
            <div className="flex gap-1.5 pr-4">
              {RANK_TYPES.map(({ label, value }) => (
                <Button
                  key={value}
                  variant={rankType === value ? 'contained' : 'outlined'}
                  onClick={() => setRankType(value)}
                  sx={{ whiteSpace: 'nowrap', minWidth: 'unset' }}
                >
                  {label}
                </Button>
              ))}
            </div>
          </DragScroll>
        </div>

        <Section className="flex-1 min-h-96">
          <DataGrid<StockRanking>
            rows={rows}
            columnDefs={COL_DEFS}
            height="100%"
            loading={isFetching}
            pagination
            pageSize={20}
            onRowClick={setSelectedStock}
            selectionHeaderName=""
            selectionColumnWidth={36}
            getRowId={(r) => r.symbol}
            showSelectionColumn={false}
          />
        </Section>
      </div>

      {/* 사이드 패널 */}
      <StockSidePanel stock={displayStock} open={panelOpen} onToggle={() => setPanelOpen(v => !v)} />
    </div>
  )
}
