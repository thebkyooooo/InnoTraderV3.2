'use client'
import React, { useCallback, useMemo, useState } from 'react'
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
import { Section } from '@/components/ui/Section'
import {
  type OrderHistoryItem,
  type SideFilter,
  type FillFilter,
  type OrderStatusCode,
} from '@/features/order/api/order-api'
import { useOrderHistory, useAmendOrder, useCancelOrder, useAccountActivitySync } from '@/features/order/api/use-order'
import { won, parseDigits, BUY_COLOR, SELL_COLOR } from './_format'

export interface OrderHistoryProps {
  accountNo: string
  height?: number | string
  /** 당일 모드 — 조회옵션·요약을 감추고 당일 데이터만 조회 (기본 false) */
  todayOnly?: boolean
  /** 행(종목) 클릭 콜백 — 클릭한 종목코드를 전달 (주문화면 종목 전환 등) */
  onSymbolSelect?: (symbol: string) => void
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
  { field: 'orderDate', headerName: '주문일자', width: 120 },
  
  { field: 'name', headerName: '종목명', flex: 1, minWidth: 110,
    cellStyle: p => ({ color: p.data?.side === 'buy' ? BUY_COLOR : SELL_COLOR, fontWeight: 600 }), filter: true },
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
  { field: 'symbol', headerName: '종목코드', width: 100, cellStyle: center, headerClass: 'header-center' },
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
 * 기간 필터는 백엔드에서 주문일자(startDate/endDate) 기준으로 적용한다.
 */
export function OrderHistory({ accountNo, height = 400, todayOnly = false, onSymbolSelect }: OrderHistoryProps) {
  // 서버에서 주문 접수/정정/취소/체결(지정가 자동체결 포함)이 발생하면 실시간으로 재조회
  useAccountActivitySync(accountNo)

  const [startDate, setStartDate] = useState<Date | null>(monthAgo())
  const [endDate, setEndDate] = useState<Date | null>(new Date())
  const [side, setSide] = useState<SideFilter>('ALL')
  const [fill, setFill] = useState<FillFilter>('ALL')

  // 기간은 YYYY-MM-DD 문자열로 변환해 백엔드 필터로 전달한다. todayOnly면 당일만.
  const todayDate = fmtDate(new Date())
  const queryStart = todayOnly ? todayDate : (startDate ? fmtDate(startDate) : undefined)
  const queryEnd = todayOnly ? todayDate : (endDate ? fmtDate(endDate) : undefined)

  const { data, isFetching: loading, refetch } = useOrderHistory({
    accountNo,
    side: todayOnly ? 'ALL' : side,
    fill: todayOnly ? 'ALL' : fill,
    startDate: queryStart,
    endDate: queryEnd,
  })

  const items = data?.items ?? []
  const summary: Summary = data?.summary ?? emptySummary

  const load = useCallback(() => { refetch() }, [refetch])

  // ── 정정/취소 ───────────────────────────────────────────────────────────────
  const today = fmtDate(new Date())
  const [cancelTarget, setCancelTarget] = useState<OrderHistoryItem | null>(null)
  const [amendTarget, setAmendTarget] = useState<OrderHistoryItem | null>(null)
  const [amendPrice, setAmendPrice] = useState<number | ''>('')
  const [amendQty, setAmendQty] = useState<number | ''>('')

  const cancelOrder = useCancelOrder()
  const amendOrder = useAmendOrder()
  const actionLoading = cancelOrder.isPending || amendOrder.isPending

  const openCancel = useCallback((it: OrderHistoryItem) => setCancelTarget(it), [])
  const openAmend = useCallback((it: OrderHistoryItem) => {
    setAmendTarget(it)
    setAmendPrice(it.price)
    setAmendQty(Math.max(0, it.quantity - it.filledQuantity))  // 미체결 잔량 기본값
  }, [])

  const doCancel = async () => {
    if (!cancelTarget) return
    try {
      await cancelOrder.mutateAsync({ accountNo, symbol: cancelTarget.symbol, originalOrderNo: cancelTarget.orderNo })
      setCancelTarget(null)
    } catch { /* 에러 시 모달 유지 */ }
  }

  const doAmend = async () => {
    if (!amendTarget) return
    const qty = typeof amendQty === 'number' ? amendQty : 0
    const prc = typeof amendPrice === 'number' ? amendPrice : 0
    if (qty <= 0 || (amendTarget.orderType === 'LIMIT' && prc <= 0)) return
    try {
      await amendOrder.mutateAsync({
        accountNo,
        symbol: amendTarget.symbol,
        originalOrderNo: amendTarget.orderNo,
        orderType: amendTarget.orderType,
        quantity: qty,
        price: prc,
      })
      setAmendTarget(null)
    } catch { /* 에러 시 모달 유지 */ }
  }

  // 당일 미체결 주문에만 정정/취소 버튼 노출
  const columnDefs = useMemo<ColDef<OrderHistoryItem>[]>(() => [
    ...baseColumns,
    {
      headerName: '정정/취소',
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
            <button type="button" onClick={e => { e.stopPropagation(); e.currentTarget.blur(); openAmend(it) }}
              className="px-2 py-0.5 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
              정정
            </button>
            <button type="button" onClick={e => { e.stopPropagation(); e.currentTarget.blur(); openCancel(it) }}
              className="px-2 py-0.5 text-xs rounded border border-gray-300 text-red-600 hover:bg-red-50">
              취소
            </button>
          </div>
        )
      },
    },
  ], [today, openAmend, openCancel])

  return (
    <div className="@container flex flex-col gap-3 h-full">
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
      <div className="grid grid-cols-1 shrink-0 gap-0 p-4 border border-gray-200 rounded-lg bg-white
        @[500px]:grid-cols-3 @[800px]:grid-cols-5 @[500px]:gap-2 @[500px]:p-0 @[500px]:border-0 @[500px]:bg-transparent">
        <SummaryItem label="주문수량" value={`${won(summary.totalQuantity)} 주`} />
        <SummaryItem label="체결수량" value={`${won(summary.totalFilledQuantity)} 주`} />
        <SummaryItem label="미체결수량" value={`${won(summary.totalUnfilledQuantity)} 주`} />
        <SummaryItem label="취소수량" value={`${won(summary.totalCanceledQuantity)} 주`} />
        <SummaryItem label="체결금액" value={`${won(summary.totalFilledAmount)} 원`} />
      </div>
      )}

      {/* 주문내역 그리드 — 박스 스타일(테두리·배경·패딩)은 todayOnly가 아닐 때만 적용
          (todayOnly로 위젯에 embed될 땐 위젯 자체 박스와 이중으로 겹치는 것을 방지) */}
      <div className={`flex-1 min-h-[220px] shrink-0 overflow-hidden ${todayOnly ? '' : 'p-4 border border-gray-200 rounded-lg bg-white'}`}>
        <DataGrid<OrderHistoryItem>
          rows={items}
          columnDefs={columnDefs}
          loading={loading}
          height={height}
          onRowClick={onSymbolSelect ? row => onSymbolSelect(row.symbol) : undefined}
          showSelectionColumn={false}
        />
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
    <div className="flex  justify-between gap-0.5 py-0.5 
      @[500px]:flex-col @[500px]:py-3 @[500px]:border border-gray-200 rounded-lg bg-white @[500px]:p-3">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-md text-right font-semibold tabular-nums">{value}</span>
    </div>
  )
}
