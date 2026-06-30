'use client'
import React, { useState, useMemo } from 'react'
import type { ColDef, ValueFormatterParams } from 'ag-grid-community'
import { SegmentedControl, Card, DataGrid } from '@/components/ui'
import { marketApi } from '@/features/market/api/market-api'
import type { MarketType, DailyTrend } from '@/features/market/api/market-api'
import { useScrollPage } from '@/components/quote/_useScrollPage'

// ─── 포매터 ────────────────────────────────────────────────────────────────────

const fmtDate = (v: string) => v.replace(/-/g, '.')

const fmtNumber = (v: number) => v.toLocaleString('ko-KR')

const fmtChangeRate = (v: number) => {
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toFixed(2)}%`
}

const fmtPrevDiff = (v: number) => {
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toLocaleString('ko-KR')}`
}

const fmtNet = (v: number) => {
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toLocaleString('ko-KR')}억`
}

const changeStyle = (v: number): React.CSSProperties => ({
  color: v > 0 ? '#e53e3e' : v < 0 ? '#3182ce' : 'inherit',
  fontWeight: v !== 0 ? 600 : undefined,
})

// ─── 컬럼 정의 ─────────────────────────────────────────────────────────────────

const COL_DEFS: ColDef<DailyTrend>[] = [
  {
    headerName: '일자',
    field: 'tradeDate',
    flex:1,
    minWidth: 110,
    sortable: false,
    cellStyle: { textAlign: 'center' },
    valueFormatter: (p: ValueFormatterParams<DailyTrend>) => fmtDate(p.value),
  },
  {
    headerName: '종가',
    field: 'closingPrice',
    flex:1,
    minWidth: 110,
    type: 'numericColumn',
    cellStyle: { textAlign: 'right' },
    valueFormatter: (p: ValueFormatterParams<DailyTrend>) => fmtNumber(p.value),
  },
  {
    headerName: '전일대비',
    field: 'prevDiff',
    flex:1,
    minWidth: 100,
    type: 'numericColumn',
    cellStyle: (p) => ({ textAlign: 'right', ...changeStyle(p.value ?? 0) }),
    valueFormatter: (p: ValueFormatterParams<DailyTrend>) => fmtPrevDiff(p.value ?? 0),
  },
  {
    headerName: '등락률',
    field: 'changeRate',
    flex:1,
    minWidth: 90,
    type: 'numericColumn',
    cellStyle: (p) => ({ textAlign: 'right', ...changeStyle(p.value ?? 0) }),
    valueFormatter: (p: ValueFormatterParams<DailyTrend>) => fmtChangeRate(p.value ?? 0),
  },
  {
    headerName: '거래량',
    field: 'volume',
    flex:1,
    minWidth: 140,
    type: 'numericColumn',
    cellStyle: { textAlign: 'right' },
    valueFormatter: (p: ValueFormatterParams<DailyTrend>) => fmtNumber(p.value),
  },
  {
    headerName: '외국인(억)',
    field: 'foreignNet',
    flex:1,
    minWidth: 120,
    type: 'numericColumn',
    cellStyle: (p) => ({ textAlign: 'right', ...changeStyle(p.value ?? 0) }),
    valueFormatter: (p: ValueFormatterParams<DailyTrend>) => fmtNet(p.value ?? 0),
  },
  {
    headerName: '개인(억)',
    field: 'individualNet',
    flex:1,
    minWidth: 120,
    type: 'numericColumn',
    cellStyle: (p) => ({ textAlign: 'right', ...changeStyle(p.value ?? 0) }),
    valueFormatter: (p: ValueFormatterParams<DailyTrend>) => fmtNet(p.value ?? 0),
  },
  {
    headerName: '기관(억)',
    field: 'institutionNet',
    flex:1,
    minWidth: 120,
    type: 'numericColumn',
    cellStyle: (p) => ({ textAlign: 'right', ...changeStyle(p.value ?? 0) }),
    valueFormatter: (p: ValueFormatterParams<DailyTrend>) => fmtNet(p.value ?? 0),
  },
]

// ─── 요약 카드 ─────────────────────────────────────────────────────────────────

function TrendSummaryCard({ title, value }: { title: string; value: number | undefined }) {
  const formatted = value == null ? '-' : fmtNet(value)
  const color = value == null ? 'inherit' : value > 0 ? '#e53e3e' : value < 0 ? '#3182ce' : 'inherit'
  return (
    <div className="w-full flex @[500px]:flex-col justify-between gap-0.5 p-3 py-2 @[500px]:py-3 border border-gray-200 rounded-lg bg-white">
      <span className="text-sm text-gray-500">{title}</span>
      <span className="text-lg text-right font-semibold tabular-nums"style={{ color }}>{formatted}</span>
    </div>
  )
}

// ─── 페이지 ────────────────────────────────────────────────────────────────────

export default function MarketTrendPage() {
  const [marketSeg, setMarketSeg] = useState<'kospi' | 'kosdaq'>('kospi')

  const marketType = useMemo<MarketType>(
    () => (marketSeg === 'kosdaq' ? 'KOSDAQ' : 'KOSPI'),
    [marketSeg],
  )

  // useScrollPage 의 FetchFn<T> 시그니처: (cursor?: string) => Promise<{ data: { items, nextCursor, hasNext } }>
  // 백엔드 응답엔 hasNext 가 없으므로 nextCursor 유무로 계산한다.
  const fetchFn = useMemo(
    () => (cursor?: string) =>
      marketApi.getDailyTrends(marketType, 100, cursor).then((res) => ({
        data: {
          items:       res.data.items,
          nextCursor:  res.data.nextCursor,
          hasNext:     res.data.nextCursor !== null,
        },
      })),
    [marketType],
  )

  const { items, loading, loadMore } = useScrollPage<DailyTrend>(
    fetchFn,
    ['market', 'daily-trends', marketType],
  )

  return (
    <div className="@container flex flex-col gap-4 w-full h-full">

      {/* 조회옵션 */}
      <div>
        <SegmentedControl
          value={marketSeg}
          onChange={(v) => setMarketSeg(v as typeof marketSeg)}
          options={[
            { label: '코스피', value: 'kospi' },
            { label: '코스닥', value: 'kosdaq' },
          ]}
          size="small"
        />
      </div>

      {/* 당일 순매수 요약 — daily-trends 첫 번째 행(최신 영업일) 기준 */}
      <div className="flex gap-1 flex-col @[500px]:flex-row @[500px]:gap-2">
        <TrendSummaryCard title="외국인 순매수" value={items[0]?.foreignNet} />
        <TrendSummaryCard title="개인 순매수"   value={items[0]?.individualNet} />
        <TrendSummaryCard title="기관 순매수"   value={items[0]?.institutionNet} />
      </div>

      {/* 일별 투자동향 그리드 — 스크롤 끝에서 자동으로 다음 페이지 로드 */}
      <div className="flex-1 min-h-96">
        <DataGrid<DailyTrend>
          rows={items}
          columnDefs={COL_DEFS}
          height="100%"
          loading={loading}
          onScrollEnd={loadMore}
        />
      </div>

    </div>
  )
}
