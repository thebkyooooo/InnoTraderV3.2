'use client'
import { useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import { quoteApi, type InvestmentTrendItem } from '@/features/quote/api/quote-api'
import { useTrendWS } from '@/features/quote/api/use-quote-ws'
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
function diffColor(v: number) {
  return v > 0 ? UP : v < 0 ? DOWN : undefined
}
function signed(n: number) {
  return n > 0 ? `+${fmtNum(n)}` : fmtNum(n)
}

const columnDefs: ColDef<InvestmentTrendItem>[] = [
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
  { field: 'foreign',     headerName: '외국인',  flex: 1, minWidth: 120, type: 'numericColumn',
    valueFormatter: p => signed(p.value as number),
    cellStyle: p => { const c = diffColor(p.value as number); return c ? { color: c } : null } },
  { field: 'individual',  headerName: '개인',    flex: 1, minWidth: 120, type: 'numericColumn',
    valueFormatter: p => signed(p.value as number),
    cellStyle: p => { const c = diffColor(p.value as number); return c ? { color: c } : null } },
  { field: 'institution', headerName: '기관',    flex: 1, minWidth: 120,  type: 'numericColumn',
    valueFormatter: p => signed(p.value as number),
    cellStyle: p => { const c = diffColor(p.value as number); return c ? { color: c } : null } },
  { field: 'volume',      headerName: '거래량',  flex: 1, minWidth: 120, type: 'numericColumn',
  valueFormatter: p => fmtNum(p.value) },
]

export interface InvestmentTrendGridProps {
  symbol: string
}

export function InvestmentTrendGrid({ symbol }: InvestmentTrendGridProps) {
  const { items, loading, loadMore } = useScrollPage<InvestmentTrendItem>(
    (cursor) => quoteApi.getTrends(symbol, 100, cursor),
    ['quote', 'trend', symbol],
  )
  const live = useTrendWS(symbol)

  // 최상단(오늘) 행을 실시간 투자동향으로 갱신. 거래일이 같을 때만 덮어쓴다.
  const rows = useMemo(() => {
    if (!live || items.length === 0) return items
    const top = items[0]
    if (live.date && live.date !== top.date) return items
    const todayLive: InvestmentTrendItem = {
      ...top,
      price: live.price,
      prevDiff: live.prevDiff,
      change: live.change,
      volume: live.volume,
      foreign: live.foreign,
      individual: live.individual,
      institution: live.institution,
    }
    return [todayLive, ...items.slice(1)]
  }, [items, live])

  return (
    <DataGrid<InvestmentTrendItem>
      rows={rows}
      columnDefs={columnDefs}
      height="100%"
      loading={loading}
      onScrollEnd={loadMore}
    />
  )
}
