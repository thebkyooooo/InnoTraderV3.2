'use client'
import React, { useCallback, useEffect, useState } from 'react'
import type { ColDef } from 'ag-grid-community'
import { DataGrid } from '@/components/ui/DataGrid'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import {
  orderApi,
  type OrderHistoryItem,
  type SideFilter,
  type FillFilter,
  type OrderStatusCode,
} from '@/features/order/api/order-api'
import { useAuthStore } from '@/store/auth-store'
import { won, BUY_COLOR, SELL_COLOR } from './_format'

export interface OrderHistoryProps {
  accountNo: string
  height?: number | string
  /** 당일 모드 — 조회옵션·요약을 감추고 당일 데이터만 조회 (기본 false) */
  todayOnly?: boolean
}

const STATUS_COLOR: Record<OrderStatusCode, string> = {
  RECEIVED: '#6b7280',
  PARTIAL: '#f59e0b',
  FILLED: '#16a34a',
  CANCELED: '#ef4444',
  AMENDED: '#6b7280',
  CANCEL_DONE: '#ef4444',
}

const right = { textAlign: 'right' as const }
const center = { textAlign: 'center' as const }
const numFmt = (p: { value: number }) => won(p.value ?? 0)

const columns: ColDef<OrderHistoryItem>[] = [
  { field: 'orderDate', headerName: '주문일자', width: 110, cellStyle: center },
  { field: 'name', headerName: '종목명', flex: 1, minWidth: 110,
    cellStyle: p => ({ color: p.data?.side === 'buy' ? BUY_COLOR : SELL_COLOR, fontWeight: 600 }) },
  { field: 'symbol', headerName: '종목코드', width: 100, cellStyle: center },
  { field: 'quantity', headerName: '주문수량', width: 100, cellStyle: right, valueFormatter: numFmt },
  { field: 'price', headerName: '주문단가', width: 110, cellStyle: right, valueFormatter: numFmt },
  { field: 'filledQuantity', headerName: '체결수량', width: 100, cellStyle: right, valueFormatter: numFmt },
  { field: 'filledPrice', headerName: '체결단가', width: 110, cellStyle: right, valueFormatter: numFmt },
  { headerName: '체결금액', width: 120, cellStyle: right,
    valueGetter: p => (p.data ? p.data.filledQuantity * p.data.filledPrice : 0), valueFormatter: numFmt },
  { field: 'orderTypeName', headerName: '주문유형', width: 90, cellStyle: center },
  { field: 'statusName', headerName: '주문상태', width: 100, cellStyle: p => ({
      ...center, color: STATUS_COLOR[(p.data?.status ?? 'RECEIVED')], fontWeight: 600 }) },
  { field: 'orderNo', headerName: '주문번호', width: 120, cellStyle: center },
  { headerName: '주문시간', width: 100, cellStyle: center,
    valueGetter: p => p.data?.orderTime ?? '' },
]

const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const monthAgo = () => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d }

interface Summary {
  totalQuantity: number; totalFilledQuantity: number; totalUnfilledQuantity: number
  totalCanceledQuantity: number; totalFilledAmount: number
}
const emptySummary: Summary = {
  totalQuantity: 0, totalFilledQuantity: 0, totalUnfilledQuantity: 0, totalCanceledQuantity: 0, totalFilledAmount: 0,
}

/**
 * 주문내역 — 조회구분(계좌·기간·주문구분·체결구분) + 요약 + 주문내역 그리드.
 * 기간 필터는 클라이언트에서 주문일자 기준으로 적용한다.
 */
export function OrderHistory({ accountNo, height = 400, todayOnly = false }: OrderHistoryProps) {
  const accessToken = useAuthStore(s => s.accessToken)

  const [startDate, setStartDate] = useState<Date | null>(monthAgo())
  const [endDate, setEndDate] = useState<Date | null>(new Date())
  const [side, setSide] = useState<SideFilter>('ALL')
  const [fill, setFill] = useState<FillFilter>('ALL')

  const [items, setItems] = useState<OrderHistoryItem[]>([])
  const [summary, setSummary] = useState<Summary>(emptySummary)
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    if (!accessToken || !accountNo) { setItems([]); setSummary(emptySummary); return }
    setLoading(true)
    orderApi.getHistory({ accountNo, side: todayOnly ? 'ALL' : side, fill: todayOnly ? 'ALL' : fill })
      .then(res => {
        const today = fmtDate(new Date())
        const from = todayOnly ? today : (startDate ? fmtDate(startDate) : null)
        const to = todayOnly ? today : (endDate ? fmtDate(endDate) : null)
        const rows = res.data.items.filter(it =>
          (!from || it.orderDate >= from) && (!to || it.orderDate <= to))
        setItems(rows)
        setSummary(rows.reduce<Summary>((acc, o) => {
          const unfilled = Math.max(0, o.quantity - o.filledQuantity)
          acc.totalQuantity += o.quantity
          acc.totalFilledQuantity += o.filledQuantity
          acc.totalFilledAmount += o.filledQuantity * o.filledPrice
          if (o.status === 'CANCELED') acc.totalCanceledQuantity += unfilled
          else acc.totalUnfilledQuantity += unfilled
          return acc
        }, { ...emptySummary }))
      })
      .catch(() => { setItems([]); setSummary(emptySummary) })
      .finally(() => setLoading(false))
  }, [accessToken, accountNo, side, fill, startDate, endDate, todayOnly])

  // 계좌/필터 변경 시 자동 조회
  useEffect(() => { load() }, [load])

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* 조회구분 */}
      {!todayOnly && (
      <div className="flex flex-col xs:flex-row xs:flex-wrap  gap-2">
        <div className="min-w-[160px] xs:max-w-[160px]">
          <DatePicker label="시작일" value={startDate} onChange={setStartDate} size="small" />
        </div>
        <div className="min-w-[160px] xs:max-w-[160px]">
          <DatePicker label="종료일" value={endDate} onChange={setEndDate} size="small" />
        </div>
        <div className="min-w-[125px]">
          <SegmentedControl<SideFilter> size="small" value={side} onChange={setSide}
          options={[{ label: '전체', value: 'ALL' }, { label: '매수', value: 'BUY' }, { label: '매도', value: 'SELL' }]} />
        </div>
        <div className="min-w-[138px]">
          <SegmentedControl<FillFilter> size="small" value={fill} onChange={setFill}
          options={[{ label: '전체', value: 'ALL' }, { label: '체결', value: 'FILLED' }, { label: '미체결', value: 'UNFILLED' }]} />
        </div>
        <Button className='h-[2.425rem] !ml-auto' variant="contained" size="medium" onClick={load}>조회</Button>
      </div>
      )}

      {/* 요약 */}
      {!todayOnly && (
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-5 gap-2 shrink-0">
        <SummaryItem label="주문수량" value={`${won(summary.totalQuantity)} 주`} />
        <SummaryItem label="체결수량" value={`${won(summary.totalFilledQuantity)} 주`} />
        <SummaryItem label="미체결수량" value={`${won(summary.totalUnfilledQuantity)} 주`} />
        <SummaryItem label="취소수량" value={`${won(summary.totalCanceledQuantity)} 주`} />
        <SummaryItem label="체결금액" value={`${won(summary.totalFilledAmount)} 원`} />
      </div>
      )}

      {/* 주문내역 그리드 */}
      <div className="flex-1 min-h-0">
        <DataGrid<OrderHistoryItem> rows={items} columnDefs={columns} loading={loading} height={height} />
      </div>
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex md:flex-col justify-between gap-0.5 p-3 py-2 md:py-3 border border-gray-200 rounded-lg bg-white">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-right font-semibold tabular-nums">{value}</span>
    </div>
  )
}
