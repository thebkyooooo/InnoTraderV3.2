'use client'
import React, { useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import { DataGrid } from '@/components/ui/DataGrid'
import { Section } from '@/components/ui/Section'
import { type HoldingItem } from '@/features/holding/api/holding-api'
import { useHoldings } from '@/features/holding/api/use-holding'
import { useAccountActivitySync } from '@/features/order/api/use-order'
import { useStockPricesWS } from '@/features/quote/api/use-quote-ws'

const UP = '#ef5350', DOWN = '#4285f4'
const fmt = (n: number) => (n ?? 0).toLocaleString('ko-KR')
const signColor = (v: number) => (v > 0 ? UP : v < 0 ? DOWN : '#6b7280')
const sign = (v: number) => (v > 0 ? '+' : '')
const right = { textAlign: 'right' as const }
const center = { textAlign: 'center' as const }

const columns: ColDef<HoldingItem>[] = [
  { field: 'name',         headerName: '종목명',   flex: 1, minWidth: 120 },
  { field: 'evalAmount',   headerName: '평가금액', width: 130, cellStyle: right, valueFormatter: p => fmt(p.value), headerClass: 'header-right' },
  { field: 'profit',       headerName: '수익금',   width: 120, cellStyle: p => ({ ...right, color: signColor(p.value), fontWeight: 600 }), valueFormatter: p => `${sign(p.value)}${fmt(p.value)}`, headerClass: 'header-right' },
  { field: 'profitRate',   headerName: '수익률',   width: 90,  cellStyle: p => ({ ...right, color: signColor(p.value), fontWeight: 600 }), valueFormatter: p => `${sign(p.value)}${Number(p.value).toFixed(2)}%`, headerClass: 'header-right' },
  { field: 'currentPrice', headerName: '현재가',   width: 110, cellStyle: right, valueFormatter: p => fmt(p.value), headerClass: 'header-right' },
  { field: 'avgPrice',     headerName: '평균단가', width: 110, cellStyle: right, valueFormatter: p => fmt(p.value), headerClass: 'header-right' },
  { field: 'quantity',     headerName: '보유수량', width: 100, cellStyle: right, valueFormatter: p => fmt(p.value), headerClass: 'header-right' },
  { field: 'symbol',       headerName: '종목코드', width: 100, cellStyle: center, headerClass: 'header-center' },
]

export interface HoldingsProps {
  accountNo: string
  height?: number | string
  /** 상단 요약(총자산/총평가금액/원금/총수익금/총수익률) 표시 여부 (기본 true) */
  showSummary?: boolean
  /** 행(종목) 클릭 콜백 — 클릭한 종목코드를 전달 (주문화면 종목 전환 등) */
  onSymbolSelect?: (symbol: string) => void
}

/**
 * 주식잔고 — 요약(총자산/총평가금액/원금/총수익금/총수익률) + 보유종목 그리드.
 * 주식잔고 조회 API 연동.
 */
export function Holdings({ accountNo, height = 400, showSummary = true, onSymbolSelect }: HoldingsProps) {
  // 서버에서 주문 접수/정정/취소/체결(지정가 자동체결 포함)이 발생하면 보유종목 실시간 재조회
  useAccountActivitySync(accountNo)

  const { data, isFetching: loading } = useHoldings(accountNo)

  // 실시간 현재가 병합 — 보유종목의 현재가/평가금액/손익/수익률을 실시간 시세로 재계산
  const symbols = useMemo(() => (data?.items ?? []).map(h => h.symbol), [data])
  const liveQuotes = useStockPricesWS(symbols)
  const items = useMemo(() => (data?.items ?? []).map(h => {
    const live = liveQuotes[h.symbol]
    if (!live) return h
    const evalAmount = h.quantity * live.price
    const cost = h.quantity * h.avgPrice
    const profit = evalAmount - cost
    const profitRate = cost === 0 ? 0 : Math.round(profit * 10000 / cost) / 100
    return { ...h, currentPrice: live.price, evalAmount, profit, profitRate }
  }), [data, liveQuotes])

  // 총평가금액/총수익금/총수익률도 실시간 병합된 종목 기준으로 재계산 (예수금은 시세와 무관하므로 스냅샷 유지)
  const s = useMemo(() => {
    if (!data?.summary) return undefined
    const totalEvalAmount = items.reduce((sum, h) => sum + h.evalAmount, 0)
    const principal = data.summary.principal
    const totalProfit = totalEvalAmount - principal
    const totalProfitRate = principal === 0 ? 0 : Math.round(totalProfit * 10000 / principal) / 100
    const cash = data.summary.totalAssets - data.summary.totalEvalAmount
    return { totalAssets: totalEvalAmount + cash, totalEvalAmount, principal, totalProfit, totalProfitRate }
  }, [data, items])

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
      <div className={`flex-1 min-h-[200px] shrink-0 overflow-hidden ${!showSummary ? '' : 'p-4 border border-gray-200 rounded-lg bg-white'}`}>
        <DataGrid<HoldingItem>
          rows={items}
          columnDefs={columns}
          loading={loading}
          height={height}
          onRowClick={onSymbolSelect ? row => onSymbolSelect(row.symbol) : undefined}
          showSelectionColumn={false}
          getRowId={h => h.symbol}
        />
      </div>
    </div>
  )
}

function SummaryItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="flex  justify-between gap-0.5 py-0.5 
        @[500px]:flex-col @[500px]:py-3 @[500px]:border border-gray-200 rounded-lg bg-white @[500px]:p-3">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-md text-right font-semibold tabular-nums" style={{ color }}>{value}</span>
      </div>
    </div>
  )
}
