'use client'
import { useCallback } from 'react'
import type { ColDef } from 'ag-grid-community'
import { quoteApi, type DailyQuoteItem } from '@/features/quote/api/quote-api'
import { DataGrid } from '@/components/ui/DataGrid'
import { useScrollPage } from './_useScrollPage'

const UP   = '#ef5350'
const DOWN = '#4285f4'

function fmtDate(d: string) {
  return `${d.slice(2, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`
}
function fmtNum(n: number) {
  return n.toLocaleString('ko-KR')
}
function fmtAmt(manWon: number) {
  if (manWon >= 100_000_000) return `${(manWon / 100_000_000).toFixed(1)}조`
  if (manWon >= 10_000)      return `${(manWon / 10_000).toFixed(1)}억`
  return `${fmtNum(manWon)}만`
}
function diffColor(v: number) {
  return v > 0 ? UP : v < 0 ? DOWN : undefined
}

const columnDefs: ColDef<DailyQuoteItem>[] = [
  { field: 'date',        headerName: '일자',    flex: 1, minWidth: 100,
    valueFormatter: p => fmtDate(p.value) },
  { field: 'price',       headerName: '현재가',    flex: 1, minWidth: 120, type: 'numericColumn',
    valueFormatter: p => fmtNum(p.value) },
  { field: 'prevDiff',    headerName: '전일대비', flex: 1, minWidth: 120, type: 'numericColumn',
    valueFormatter: p => p.value > 0 ? `▲${fmtNum(p.value)}` : p.value < 0 ? `▼${fmtNum(Math.abs(p.value))}` : fmtNum(p.value),
    cellStyle: p => { const c = diffColor(p.value as number); return c ? { color: c } : null } },
  { field: 'change',      headerName: '등락률',  flex: 1, minWidth: 100, type: 'numericColumn',
    valueFormatter: p => (p.value > 0 ? '+' : '') + (p.value as number).toFixed(2) + '%',
    cellStyle: p => { const c = diffColor(p.value as number); return c ? { color: c } : null } },
  { field: 'open',        headerName: '시가',    flex: 1, minWidth: 120, type: 'numericColumn',
    valueFormatter: p => fmtNum(p.value) },
  { field: 'high',        headerName: '고가',    flex: 1, minWidth: 120, type: 'numericColumn',
    valueFormatter: p => fmtNum(p.value),
    cellStyle: () => ({ color: UP }) },
  { field: 'low',         headerName: '저가',    flex: 1, minWidth: 120, type: 'numericColumn',
    valueFormatter: p => fmtNum(p.value),
    cellStyle: () => ({ color: DOWN }) },
  { field: 'volume',      headerName: '거래량',  flex: 1, minWidth: 150, type: 'numericColumn',
    valueFormatter: p => fmtNum(p.value) },
  { field: 'turnoverMan', headerName: '거래금액', flex: 1, minWidth: 150, type: 'numericColumn',
    valueFormatter: p => fmtAmt(p.value) },
]

export interface DailyQuoteGridProps {
  symbol: string
}

export function DailyQuoteGrid({ symbol }: DailyQuoteGridProps) {
  const fetchFn = useCallback(
    (cursor?: string) => quoteApi.getDaily(symbol, 100, cursor),
    [symbol]
  )
  const { items, loading, loadMore } = useScrollPage<DailyQuoteItem>(fetchFn)

  return (
    <DataGrid<DailyQuoteItem>
      rows={items}
      columnDefs={columnDefs}
      height="100%"
      loading={loading}
      onScrollEnd={loadMore}
    />
  )
}
