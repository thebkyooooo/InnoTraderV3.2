'use client'
import { useEffect, useMemo, useState } from 'react'
import type { ColDef } from 'ag-grid-community'
import { quoteApi, type FilledQuoteItem } from '@/features/quote/api/quote-api'
import { useFilledWS } from '@/features/quote/api/use-quote-ws'
import { DataGrid } from '@/components/ui/DataGrid'
import { useScrollPage } from './_useScrollPage'

const UP   = '#ef5350'
const DOWN = '#4285f4'

/** 실시간 누적 체결 최대 보관 수 (메모리 보호) */
const MAX_LIVE = 200

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
  const live = useFilledWS(symbol)
  const [liveTicks, setLiveTicks] = useState<FilledQuoteItem[]>([])

  // symbol 변경 시 실시간 누적 초기화
  useEffect(() => {
    setLiveTicks([])
  }, [symbol])

  // 체결 WS 메시지마다 새 체결 행을 맨 위에 추가(prepend).
  // 모든 필드(매도/매수호가·체결수량·체결강도 포함)를 백엔드가 정확히 내려준다.
  useEffect(() => {
    if (!live || !live.time) return
    setLiveTicks((list) => {
      // 같은 시각·동일 누적거래량이면 중복(StrictMode 이중 실행 등) 방지
      if (list[0] && list[0].time === live.time && list[0].volume === live.volume) return list
      return [live, ...list].slice(0, MAX_LIVE)
    })
  }, [live])

  // 실시간 누적분(최신순) + 과거 API 데이터
  const rows = useMemo(() => [...liveTicks, ...items], [liveTicks, items])

  return (
    <DataGrid<FilledQuoteItem>
      rows={rows}
      columnDefs={columnDefs}
      height="100%"
      loading={loading}
      onScrollEnd={loadMore}
    />
  )
}
