'use client'
import React, { useEffect, useMemo, useState } from 'react'
import InputAdornment from '@mui/material/InputAdornment'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useOrderableAmount, useOrderableShares } from '@/features/account/api/use-account'
import { type OrderResponse, type OrderTypeCode } from '@/features/order/api/order-api'
import { useBuyOrder, useSellOrder } from '@/features/order/api/use-order'
import { won, parseDigits, BUY_COLOR, SELL_COLOR } from './_format'

type Side = 'buy' | 'sell'
type CashType = 'cash' | 'credit'
type NumOrEmpty = number | ''

export interface OrderFormProps {
  accountNo: string
  symbol: string
  name: string
  /** 현재가 — 지정가 기본값 및 시장가 주문금액 추정에 사용 */
  currentPrice?: number
  /** 주문 완료 후 콜백 (주문내역 새로고침 등) */
  onOrdered?: (res: OrderResponse) => void
}

const PCT_BUTTONS = [
  { label: '10%', v: 0.1 },
  { label: '25%', v: 0.25 },
  { label: '50%', v: 0.5 },
  { label: '100%', v: 1 },
]

/**
 * 주문폼 — 매수/매도 탭, 주문구분(현금/신용), 주문유형(지정가/시장가),
 * 가격·수량 입력(천단위 콤마), 수량 비율 버튼, 주문가능금액/수량, 주문확인·완료 모달.
 */
export function OrderForm({ accountNo, symbol, name, currentPrice, onOrdered }: OrderFormProps) {
  const [side, setSide] = useState<Side>('buy')
  const [cashType, setCashType] = useState<CashType>('cash')
  const [orderType, setOrderType] = useState<OrderTypeCode>('LIMIT')
  const [price, setPrice] = useState<NumOrEmpty>('')
  const [quantity, setQuantity] = useState<NumOrEmpty>('')

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [doneOpen, setDoneOpen] = useState(false)
  const [done, setDone] = useState<{ qty: number; amount: number; side: Side } | null>(null)

  const isMarket = orderType === 'MARKET'

  // 지정가 진입 시 현재가로 가격 프리필
  useEffect(() => {
    if (!isMarket && price === '' && currentPrice) setPrice(currentPrice)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPrice, orderType])

  // 주문가능금액(매수) / 주문가능수량(매도) 조회
  const { data: amountData } = useOrderableAmount(accountNo, { enabled: side === 'buy' })
  const { data: sharesData } = useOrderableShares(accountNo, symbol, { enabled: side === 'sell' })
  const orderableAmount = side === 'buy' ? (amountData?.orderableAmount ?? 0) : 0
  const orderableShares = side === 'sell' ? (sharesData?.orderableShares ?? 0) : 0

  const buyOrder = useBuyOrder()
  const sellOrder = useSellOrder()
  const submitting = buyOrder.isPending || sellOrder.isPending

  const effectivePrice = isMarket ? (currentPrice ?? 0) : (typeof price === 'number' ? price : 0)
  const qtyNum = typeof quantity === 'number' ? quantity : 0
  const orderAmount = effectivePrice * qtyNum

  // 비율 버튼 기준 최대 수량
  const maxQty = useMemo(() => {
    if (side === 'buy') return effectivePrice > 0 ? Math.floor(orderableAmount / effectivePrice) : 0
    return orderableShares
  }, [side, effectivePrice, orderableAmount, orderableShares])

  const setPct = (pct: number) => setQuantity(Math.floor(maxQty * pct))

  const canSubmit = !!accountNo && !!symbol && qtyNum > 0 && (isMarket || effectivePrice > 0)
  const sideColor = side === 'buy' ? BUY_COLOR : SELL_COLOR
  const sideLabel = side === 'buy' ? '매수' : '매도'

  const submit = async () => {
    try {
      const req = { accountNo, symbol, orderType, quantity: qtyNum, price: effectivePrice }
      const res = side === 'buy' ? await buyOrder.mutateAsync(req) : await sellOrder.mutateAsync(req)
      setConfirmOpen(false)
      setDone({ qty: qtyNum, amount: orderAmount, side })
      setDoneOpen(true)
      setQuantity('')
      onOrdered?.(res.data)
    } catch {
      setConfirmOpen(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* 매수/매도 탭 */}
      <div className="grid grid-cols-2 rounded-md overflow-hidden border border-gray-200">
        {(['buy', 'sell'] as Side[]).map(s => {
          const active = side === s
          const color = s === 'buy' ? BUY_COLOR : SELL_COLOR
          return (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              className="py-2 text-sm font-bold transition-colors"
              style={active
                ? { background: color, color: '#fff' }
                : { background: 'transparent', color: '#6b7280' }}
            >
              {s === 'buy' ? '매수' : '매도'}
            </button>
          )
        })}
      </div>

      {/* 주문구분 (현금/신용) */}
      {/* <Field label="주문구분">
        <SegmentedControl<CashType>
          size="small"
          value={cashType}
          onChange={setCashType}
          options={[{ label: '현금', value: 'cash' }, { label: '신용', value: 'credit' }]}
        />
      </Field> */}

      {/* 종목 표시 */}
      <div className='flex items-center gap-2'>
        <label className='text-xs'>종목</label>
        <div className="flex-1 flex items-center justify-end gap-2">
          <span className="text-sm font-semibold text-foreground">{name || '-'}</span>
          <span className="text-xs text-gray-500">{symbol || ''}</span>
        </div>
      </div>

      {/* 주문유형 (지정가/시장가) */}
      <div className='flex items-center gap-2'>
        <label className='text-xs'>유형</label>
        <div className="flex-1 flex items-center justify-end gap-2">
          <SegmentedControl<OrderTypeCode>
            size="small"
            value={orderType}
            onChange={setOrderType}
            options={[{ label: '지정가', value: 'LIMIT' }, { label: '시장가', value: 'MARKET' }]}
          />
        </div>
      </div>

      {/* 가격 */}
      <Input
        label="가격"
        size="small"
        value={isMarket ? '시장가' : (price === '' ? '' : won(price))}
        disabled={isMarket}
        onChange={e => {
          const d = parseDigits(e.target.value)
          setPrice(d === '' ? '' : Number(d))
        }}
        slotProps={{
          input: { endAdornment: <InputAdornment position="end">원</InputAdornment> },
          htmlInput: { inputMode: 'numeric' },
        }}
      />

      {/* 수량 */}
      <Input
        label="수량"
        size="small"
        value={quantity === '' ? '' : won(quantity)}
        onChange={e => {
          const d = parseDigits(e.target.value)
          setQuantity(d === '' ? '' : Number(d))
        }}
        slotProps={{
          input: { endAdornment: <InputAdornment position="end">주</InputAdornment> },
          htmlInput: { inputMode: 'numeric' },
        }}
      />

      {/* 수량 비율 버튼 */}
      <div className="grid grid-cols-4 gap-1.5">
        {PCT_BUTTONS.map(b => (
          <button
            key={b.label}
            type="button"
            onClick={() => setPct(b.v)}
            disabled={maxQty <= 0}
            className="py-1.5 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* 주문금액 / 주문가능 */}
      <div className="flex flex-col gap-1 rounded-md bg-gray-50 px-3 py-2 text-sm">
        <Row label="주문금액" value={`${won(orderAmount)} 원`} strong />
        {side === 'buy'
          ? <Row label="주문가능금액" value={`${won(orderableAmount)} 원`} />
          : <Row label="주문가능수량" value={`${won(orderableShares)} 주`} />}
      </div>

      {/* 매수/매도 버튼 */}
      <Button
        variant="contained"
        fullWidth
        disabled={!canSubmit}
        onClick={e => { e.currentTarget.blur(); setConfirmOpen(true) }}
        sx={{ bgcolor: sideColor, '&:hover': { bgcolor: sideColor, filter: 'brightness(0.95)' } }}
      >
        {sideLabel}
      </Button>

      {/* 주문확인 모달 */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth={280}>
        <DialogTitle sx={{ pt: 3, pb: 1.5, fontSize: 16, fontWeight: 700 }}>{sideLabel} 주문 확인</DialogTitle>
        <DialogContent>
          <div className="flex flex-col gap-1.5 text-sm border-t border-b border-gray-200 py-3">
            <Row label="계좌번호" value={accountNo} />
            <Row label="주문종목" value={`${name} (${symbol})`} />
            <Row label="주문유형" value={isMarket ? '시장가' : '지정가'} />
            <Row label="주문가격" value={isMarket ? '시장가' : `${won(effectivePrice)} 원`} />
            <Row label="주문수량" value={`${won(qtyNum)} 주`} />
            <Row label="주문금액" value={`${won(orderAmount)} 원`} strong />
          </div>
        </DialogContent>
        <DialogActions sx={{ pt: 0, pb: 3, px: 3 }}>
          <Button variant="outlined" color="inherit" onClick={() => setConfirmOpen(false)}>취소</Button>
          <Button
            variant="contained"
            loading={submitting}
            onClick={e => { e.currentTarget.blur(); submit() }}
            sx={{ bgcolor: sideColor, '&:hover': { bgcolor: sideColor, filter: 'brightness(0.95)' } }}
          >
            {sideLabel}
          </Button>
        </DialogActions>
      </Modal>

      {/* 주문완료 모달 */}
      <Modal open={doneOpen} onClose={() => setDoneOpen(false)} maxWidth={280}>
        <DialogTitle sx={{ pt: 3, pb: 2, fontSize: 16, fontWeight: 700 }}>주문 완료</DialogTitle>
        <DialogContent>
          <p className="text-sm leading-relaxed">
            <b>{name}</b> {won(done?.qty ?? 0)}주 {won(done?.amount ?? 0)}원{' '}
            <b style={{ color: done?.side === 'buy' ? BUY_COLOR : SELL_COLOR }}>
              {done?.side === 'buy' ? '매수' : '매도'}
            </b> 주문이 완료되었습니다.
          </p>
        </DialogContent>
        <DialogActions sx={{ pt: 0, pb: 3, px: 3 }}>
          <Button variant="contained" onClick={() => setDoneOpen(false)}>확인</Button>
        </DialogActions>
      </Modal>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      {children}
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
