'use client'
import React from 'react'
import type { ColDef } from 'ag-grid-community'
import { DataGrid } from '@/components/ui/DataGrid'
import { Section } from '@/components/ui/Section'
import { type HoldingItem } from '@/features/holding/api/holding-api'
import { useHoldings } from '@/features/holding/api/use-holding'

const UP = '#ef5350', DOWN = '#4285f4'
const fmt = (n: number) => (n ?? 0).toLocaleString('ko-KR')
const signColor = (v: number) => (v > 0 ? UP : v < 0 ? DOWN : '#6b7280')
const sign = (v: number) => (v > 0 ? '+' : '')
const right = { textAlign: 'right' as const }
const center = { textAlign: 'center' as const }

const columns: ColDef<HoldingItem>[] = [
  { field: 'name',         headerName: '종목명',   flex: 1, minWidth: 120 },
  { field: 'quantity',     headerName: '보유수량', width: 100, cellStyle: right, valueFormatter: p => fmt(p.value), headerClass: 'header-right' },
  { field: 'avgPrice',     headerName: '평균단가', width: 110, cellStyle: right, valueFormatter: p => fmt(p.value), headerClass: 'header-right' },
  { field: 'currentPrice', headerName: '현재가',   width: 110, cellStyle: right, valueFormatter: p => fmt(p.value), headerClass: 'header-right' },
  { field: 'evalAmount',   headerName: '평가금액', width: 130, cellStyle: right, valueFormatter: p => fmt(p.value), headerClass: 'header-right' },
  { field: 'profit',       headerName: '수익금',   width: 120, cellStyle: p => ({ ...right, color: signColor(p.value), fontWeight: 600 }), valueFormatter: p => `${sign(p.value)}${fmt(p.value)}`, headerClass: 'header-right' },
  { field: 'profitRate',   headerName: '수익률',   width: 90,  cellStyle: p => ({ ...right, color: signColor(p.value), fontWeight: 600 }), valueFormatter: p => `${sign(p.value)}${Number(p.value).toFixed(2)}%`, headerClass: 'header-right' },
  { field: 'symbol',       headerName: '종목코드', width: 100, cellStyle: center, headerClass: 'header-center' },
]

export interface HoldingsProps {
  accountNo: string
  height?: number | string
  /** 상단 요약(총자산/총평가금액/원금/총수익금/총수익률) 표시 여부 (기본 true) */
  showSummary?: boolean
}

/**
 * 주식잔고 — 요약(총자산/총평가금액/원금/총수익금/총수익률) + 보유종목 그리드.
 * 주식잔고 조회 API 연동.
 */
export function Holdings({ accountNo, height = 400, showSummary = true }: HoldingsProps) {
  const { data, isFetching: loading } = useHoldings(accountNo)

  const s = data?.summary

  return (
    <div className="@container flex flex-col gap-3 h-full">
      {/* 요약 */}
      {showSummary && (
        <div className="grid grid-cols-1 shrink-0 gap-0 p-4 border border-gray-200 rounded-lg bg-white
          @[500px]:grid-cols-3 @[800px]:grid-cols-5 @[500px]:gap-2 @[500px]:p-0 @[500px]:border-0 @[500px]:bg-transparent">
          <SummaryItem label="총자산"     value={fmt(s?.totalAssets ?? 0)} />
          <SummaryItem label="총평가금액" value={fmt(s?.totalEvalAmount ?? 0)} />
          <SummaryItem label="원금"       value={fmt(s?.principal ?? 0)} />
          <SummaryItem label="총수익금"   value={`${sign(s?.totalProfit ?? 0)}${fmt(s?.totalProfit ?? 0)}`} color={signColor(s?.totalProfit ?? 0)} />
          <SummaryItem label="총수익률"   value={`${sign(s?.totalProfitRate ?? 0)}${Number(s?.totalProfitRate ?? 0).toFixed(2)}%`} color={signColor(s?.totalProfitRate ?? 0)} />
        </div>
      )}

      {/* 보유종목 그리드 */}
      <Section className='flex-1 min-h-[360px] shrink-0'>
        <DataGrid<HoldingItem> rows={data?.items ?? []} columnDefs={columns} loading={loading} height={height} />
      </Section>
    </div>
  )
}

function SummaryItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="flex  justify-between gap-0.5 py-0.5 
        @[500px]:flex-col @[500px]:py-3 @[500px]:border border-gray-200 rounded-lg bg-white @[500px]:p-3">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-sm text-right font-semibold tabular-nums" style={{ color }}>{value}</span>
      </div>
    </div>
  )
}
