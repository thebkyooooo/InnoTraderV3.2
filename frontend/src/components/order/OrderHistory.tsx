'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import InputAdornment from '@mui/material/InputAdornment'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { DataGrid } from '@/components/ui/DataGrid'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
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
import { won, parseDigits, BUY_COLOR, SELL_COLOR } from './_format'

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

const baseColumns: ColDef<OrderHistoryItem>[] = [
  { field: 'orderDate', headerName: '주문일자', width: 110 },
  { field: 'name', headerName: '종목명', flex: 1, minWidth: 110,
    cellStyle: p => ({ color: p.data?.side === 'buy' ? BUY_COLOR : SELL_COLOR, fontWeight: 600 }), filter: true },
  { field: 'symbol', headerName: '종목코드', width: 100, cellStyle: center, headerClass: 'header-center' },
  { field: 'sideName', headerName: '주문구분', width: 100, headerClass: 'header-center',
    cellStyle: p => ({ ...center, color: p.data?.side === 'buy' ? BUY_COLOR : SELL_COLOR, fontWeight: 600 }), filter: true },
  { field: 'quantity', headerName: '주문수량', width: 100, cellStyle: right, headerClass: 'header-right', valueFormatter: numFmt },
  { field: 'price', headerName: '주문단가', width: 110, cellStyle: right, headerClass: 'header-right', valueFormatter: numFmt },
  { field: 'filledQuantity', headerName: '체결수량', width: 100, cellStyle: right, headerClass: 'header-right', valueFormatter: numFmt },
  { headerName: '미체결수량', width: 100, cellStyle: right, headerClass: 'header-right',
    valueGetter: p => (p.data ? p.data.quantity - p.data.filledQuantity : 0), valueFormatter: numFmt },
  { field: 'filledPrice', headerName: '체결단가', width: 110, cellStyle: right, headerClass: 'header-right', valueFormatter: numFmt },
  { headerName: '체결금액', width: 120, cellStyle: right, headerClass: 'header-right',
    valueGetter: p => (p.data ? p.data.filledQuantity * p.data.filledPrice : 0), valueFormatter: numFmt },
  { field: 'orderTypeName', headerName: '주문유형', width: 100, cellStyle: center, filter: true },
  { field: 'statusName', headerName: '주문상태', width: 100, cellStyle: p => ({
      ...center, color: STATUS_COLOR[(p.data?.status ?? 'RECEIVED')], fontWeight: 600 }), filter: true },
  { field: 'orderNo', headerName: '주문번호', width: 120, headerClass: 'header-center', cellStyle: center },
  { headerName: '주문시간', width: 100, cellStyle: center, headerClass: 'header-center',
    valueGetter: p => p.data?.orderTime ?? '' },
]

const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** 당일 미체결(접수/부분체결) 주문 — 정정·취소 가능 */
const isCancelable = (it: OrderHistoryItem, today: string) =>
  it.orderDate === today && (it.status === 'RECEIVED' || it.status === 'PARTIAL')

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

  // ── 정정/취소 ───────────────────────────────────────────────────────────────
  const today = fmtDate(new Date())
  const [cancelTarget, setCancelTarget] = useState<OrderHistoryItem | null>(null)
  const [amendTarget, setAmendTarget] = useState<OrderHistoryItem | null>(null)
  const [amendPrice, setAmendPrice] = useState<number | ''>('')
  const [amendQty, setAmendQty] = useState<number | ''>('')
  const [actionLoading, setActionLoading] = useState(false)

  const openCancel = useCallback((it: OrderHistoryItem) => setCancelTarget(it), [])
  const openAmend = useCallback((it: OrderHistoryItem) => {
    setAmendTarget(it)
    setAmendPrice(it.price)
    setAmendQty(Math.max(0, it.quantity - it.filledQuantity))  // 미체결 잔량 기본값
  }, [])

  const doCancel = async () => {
    if (!cancelTarget) return
    setActionLoading(true)
    try {
      await orderApi.cancel({ accountNo, symbol: cancelTarget.symbol, originalOrderNo: cancelTarget.orderNo })
      setCancelTarget(null)
      load()
    } catch { /* 에러 시 모달 유지 */ } finally { setActionLoading(false) }
  }

  const doAmend = async () => {
    if (!amendTarget) return
    const qty = typeof amendQty === 'number' ? amendQty : 0
    const prc = typeof amendPrice === 'number' ? amendPrice : 0
    if (qty <= 0 || (amendTarget.orderType === 'LIMIT' && prc <= 0)) return
    setActionLoading(true)
    try {
      await orderApi.amend({
        accountNo,
        symbol: amendTarget.symbol,
        originalOrderNo: amendTarget.orderNo,
        orderType: amendTarget.orderType,
        quantity: qty,
        price: prc,
      })
      setAmendTarget(null)
      load()
    } catch { /* 에러 시 모달 유지 */ } finally { setActionLoading(false) }
  }

  // 당일 미체결 주문에만 정정/취소 버튼 노출
  const columnDefs = useMemo<ColDef<OrderHistoryItem>[]>(() => [
    ...baseColumns,
    {
      headerName: '주문관리',
      width: 100,
      // pinned: 'right',
      sortable: false,
      headerClass: 'header-center',
      cellStyle: { ...center, padding: 0 },
      cellRenderer: (p: ICellRendererParams<OrderHistoryItem>) => {
        const it = p.data
        if (!it || !isCancelable(it, today)) return null
        return (
          <div className="flex items-center justify-center gap-1 h-full">
            <button type="button" onClick={e => { e.currentTarget.blur(); openAmend(it) }}
              className="px-2 py-0.5 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
              정정
            </button>
            <button type="button" onClick={e => { e.currentTarget.blur(); openCancel(it) }}
              className="px-2 py-0.5 text-xs rounded border border-gray-300 text-red-600 hover:bg-red-50">
              취소
            </button>
          </div>
        )
      },
    },
  ], [today, openAmend, openCancel])

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* 조회구분 */}
      {!todayOnly && (
      <div className="flex flex-col xs:flex-row xs:flex-wrap gap-2">
        <div className="min-w-[160px] xs:max-w-[160px]">
          <DatePicker label="시작일" value={startDate} onChange={setStartDate} size="small" />
        </div>
        <div className="min-w-[160px] xs:max-w-[160px]">
          <DatePicker label="종료일" value={endDate} onChange={setEndDate} size="small" />
        </div>
        <div className="flex gap-2">
          <SegmentedControl<SideFilter> size="small" value={side} onChange={setSide}
            options={[{ label: '전체', value: 'ALL' }, { label: '매수', value: 'BUY' }, { label: '매도', value: 'SELL' }]} />
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
        <DataGrid<OrderHistoryItem> rows={items} columnDefs={columnDefs} loading={loading} height={height} />
      </div>

      {/* 취소 확인 모달 */}
      <Modal open={!!cancelTarget} onClose={() => setCancelTarget(null)} maxWidth={300}>
        <DialogTitle sx={{ pt: 3, pb: 1.5, fontSize: 16, fontWeight: 700 }}>주문 취소</DialogTitle>
        <DialogContent>
          <div className="flex flex-col gap-1.5 text-sm border-t border-b border-gray-200 py-3">
            <Row label="주문종목" value={`${cancelTarget?.name ?? ''} (${cancelTarget?.symbol ?? ''})`} />
            <Row label="주문구분" value={cancelTarget?.sideName ?? ''} />
            <Row label="주문수량" value={`${won(cancelTarget?.quantity ?? 0)} 주`} />
            <Row label="미체결수량" value={`${won(Math.max(0, (cancelTarget?.quantity ?? 0) - (cancelTarget?.filledQuantity ?? 0)))} 주`} strong />
          </div>
          <p className="text-xs text-gray-500 mt-2">미체결 잔량을 취소합니다. 진행하시겠습니까?</p>
        </DialogContent>
        <DialogActions sx={{ pt: 0, pb: 3, px: 3 }}>
          <Button variant="outlined" color="inherit" onClick={() => setCancelTarget(null)}>취소</Button>
          <Button variant="contained" color="error" loading={actionLoading} onClick={doCancel}>주문 취소</Button>
        </DialogActions>
      </Modal>

      {/* 정정 모달 */}
      <Modal open={!!amendTarget} onClose={() => setAmendTarget(null)} maxWidth={300}>
        <DialogTitle sx={{ pt: 3, pb: 1.5, fontSize: 16, fontWeight: 700 }}>주문 정정</DialogTitle>
        <DialogContent>
          <div className="flex flex-col gap-1.5 text-sm border-t border-b border-gray-200 py-3 mb-3">
            <Row label="주문종목" value={`${amendTarget?.name ?? ''} (${amendTarget?.symbol ?? ''})`} />
            <Row label="주문구분" value={amendTarget?.sideName ?? ''} />
            <Row label="주문유형" value={amendTarget?.orderTypeName ?? ''} />
          </div>
          <div className="flex flex-col gap-2">
            <Input
              label="정정가격"
              size="small"
              value={amendTarget?.orderType === 'MARKET' ? '시장가' : (amendPrice === '' ? '' : won(amendPrice))}
              disabled={amendTarget?.orderType === 'MARKET'}
              onChange={e => { const d = parseDigits(e.target.value); setAmendPrice(d === '' ? '' : Number(d)) }}
              slotProps={{
                input: { endAdornment: <InputAdornment position="end">원</InputAdornment> },
                htmlInput: { inputMode: 'numeric' },
              }}
            />
            <Input
              label="정정수량"
              size="small"
              value={amendQty === '' ? '' : won(amendQty)}
              onChange={e => { const d = parseDigits(e.target.value); setAmendQty(d === '' ? '' : Number(d)) }}
              slotProps={{
                input: { endAdornment: <InputAdornment position="end">주</InputAdornment> },
                htmlInput: { inputMode: 'numeric' },
              }}
            />
          </div>
        </DialogContent>
        <DialogActions sx={{ pt: 0, pb: 3, px: 3 }}>
          <Button variant="outlined" color="inherit" onClick={() => setAmendTarget(null)}>취소</Button>
          <Button variant="contained" loading={actionLoading} onClick={doAmend}>주문 정정</Button>
        </DialogActions>
      </Modal>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={strong ? 'font-bold text-foreground' : 'text-foreground'}>{value}</span>
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
