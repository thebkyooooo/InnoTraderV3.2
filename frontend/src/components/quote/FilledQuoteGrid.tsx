'use client'
import type { ColDef } from 'ag-grid-community'
import { quoteApi, type FilledQuoteItem } from '@/features/quote/api/quote-api'
import { DataGrid } from '@/components/ui/DataGrid'
import { useScrollPage } from './_useScrollPage'

const UP   = '#ef5350'
const DOWN = '#4285f4'

function fmtTime(t: string) {
  return `${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6)}`
}
function fmtNum(n: number) {
  return n.toLocaleString('ko-KR')
}
function diffColor(v: number) {
  return v > 0 ? UP : v < 0 ? DOWN : undefined
}

const columnDefs: ColDef<FilledQuoteItem>[] = [
  { field: 'time',         headerName: '시간',    flex: 1, minWidth: 100,
    valueFormatter: p => fmtTime(p.value) },
  { field: 'price',        headerName: '현재가',  flex: 1, minWidth: 120, type: 'numericColumn',
    valueFormatter: p => fmtNum(p.value) },
  { field: 'prevDiff',     headerName: '전일대비', flex: 1, minWidth: 120, type: 'numericColumn',
    valueFormatter: p => p.value > 0 ? `▲${fmtNum(p.value)}` : p.value < 0 ? `▼${fmtNum(Math.abs(p.value))}` : fmtNum(p.value),
    cellStyle: p => { const c = diffColor(p.value as number); return c ? { color: c } : null } },
  { field: 'change',       headerName: '등락률',  flex: 1, minWidth: 100, type: 'numericColumn',
    valueFormatter: p => (p.value > 0 ? '+' : '') + (p.value as number).toFixed(2) + '%',
    cellStyle: p => { const c = diffColor(p.value as number); return c ? { color: c } : null } },
  { field: 'askPrice',     headerName: '매도호가', flex: 1, minWidth: 120, type: 'numericColumn',
    valueFormatter: p => fmtNum(p.value),
    cellStyle: () => ({ color: UP }) },
  { field: 'bidPrice',     headerName: '매수호가', flex: 1, minWidth: 120, type: 'numericColumn',
    valueFormatter: p => fmtNum(p.value),
    cellStyle: () => ({ color: DOWN }) },
  { field: 'filledVolume', headerName: '체결량',  flex: 1, minWidth: 120, type: 'numericColumn',
    valueFormatter: p => fmtNum(p.value) },
  { field: 'fillStrength', headerName: '체결강도', flex: 1, minWidth: 100, type: 'numericColumn',
    valueFormatter: p => (p.value as number).toFixed(1) },
  { field: 'volume',       headerName: '거래량',  flex: 1, minWidth: 150  ,  type: 'numericColumn',
    valueFormatter: p => fmtNum(p.value) },
]

export interface FilledQuoteGridProps {
  symbol: string
}

export function FilledQuoteGrid({ symbol }: FilledQuoteGridProps) {
  const { items, loading, loadMore } = useScrollPage<FilledQuoteItem>(
    (cursor) => quoteApi.getFilled(symbol, 100, cursor),
    ['quote', 'filled', symbol],
  )

  return (
    <DataGrid<FilledQuoteItem>
      rows={items}
      columnDefs={columnDefs}
      height="100%"
      loading={loading}
      onScrollEnd={loadMore}
    />
  )
}
