'use client'
import React, { useEffect, useRef } from 'react'
import { type HogaData } from '@/features/quote/api/quote-api'
import { useStockPrice, useHoga } from '@/features/quote/api/use-quote'
import { useHogaWS, useStockPriceWS } from '@/features/quote/api/use-quote-ws'

// 색상: 매도=파랑, 매수=빨강 (한국 HTS 관례)
const ASK = '#4285f4'
const BID = '#ef5350'
const ASK_BG  = 'rgba(66,133,244,0.08)'
const BID_BG  = 'rgba(239,83,80,0.08)'
const ASK_BAR = 'rgba(66,133,244,0.28)'
const BID_BAR = 'rgba(239,83,80,0.28)'

// 공통 높이 (px) — DOM·Canvas 동일 적용
const HEADER_H = 28
const ROW_H    = 24
const FOOTER_H = 28

const fmt = (n: number) => n.toLocaleString('ko-KR')
const fmtPct = (p: number) => `${p >= 0 ? '+' : ''}${p.toFixed(2)}%`
// 전일종가 대비 등락률(%)
const pctOf = (price: number, prevClose: number) => (prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0)
// 등락 색상: 상승 빨강 / 하락 파랑 / 보합 회색
const changeColor = (p: number) => (p > 0 ? '#ef5350' : p < 0 ? '#4285f4' : '#6b7280')

export type OrderBookVariant = 'dom' | 'canvas'

export interface OrderBookProps {
  symbol: string
  /** 렌더링 방식 — 'dom'(기본) 또는 'canvas'. 높이는 행 수 기준으로 양쪽 동일 고정 */
  variant?: OrderBookVariant
  /** 호가 클릭 콜백 — 클릭한 가격을 전달 (주문폼 가격 채우기 등) */
  onPriceClick?: (price: number) => void
}

interface Row { price: number; askVol: number; bidVol: number; side: 'ask' | 'bid' }

// 가격 내림차순 사다리: 매도10(최상단)~매도1, 매수1~매수10(최하단)
function buildRows(data: HogaData) {
  const asksDesc = [...data.asks].reverse() // 낮은→높은 을 높은→낮은 으로
  const rows: Row[] = [
    ...asksDesc.map(a => ({ price: a.price, askVol: a.volume, bidVol: 0, side: 'ask' as const })),
    ...data.bids.map(b => ({ price: b.price, askVol: 0, bidVol: b.volume, side: 'bid' as const })),
  ]
  const askTotal = data.asks.reduce((s, a) => s + a.volume, 0)
  const bidTotal = data.bids.reduce((s, b) => s + b.volume, 0)
  const maxVol = Math.max(1, ...rows.map(r => Math.max(r.askVol, r.bidVol)))
  return { rows, maxVol, askTotal, bidTotal }
}

// ─── DOM 기반 ─────────────────────────────────────────────────────────────────

function OrderBookDom({ data, prevClose, currentPrice, onPriceClick }: { data: HogaData; prevClose: number; currentPrice: number; onPriceClick?: (price: number) => void }) {
  const { rows, maxVol, askTotal, bidTotal } = buildRows(data)

  // 호가 컬럼 폭을 "호가 + 등락률" 길이에 맞춰 가변 (잔량 컬럼은 남는 폭을 균등 분배)
  const midChars = Math.max(...rows.map(r => `${fmt(r.price)} ${fmtPct(pctOf(r.price, prevClose))}`.length))
  const gridTemplateColumns = `1fr ${midChars + 2}ch 1fr`

  return (
    <div className="w-full text-xs select-none border-y border-gray-200 overflow-hidden rounded-xl">
      {/* 헤더 */}
      <div className="grid font-medium text-gray-500 bg-gray-50 border-b border-gray-200" style={{ gridTemplateColumns, height: HEADER_H }}>
        <div className="flex items-center justify-end pr-2">매도잔량</div>
        <div className="flex items-center justify-center">호가</div>
        <div className="flex items-center justify-start pl-2">매수잔량</div>
      </div>

      {/* 본문 */}
      {rows.map((r, i) => (
        <div key={i} className="grid"
          style={{ gridTemplateColumns, height: ROW_H }}>
          {/* 매도잔량 (매도 행만) — 막대는 우측(호가 쪽)에서 좌측으로 */}
          <div className="relative flex items-center justify-end pr-2 overflow-hidden"
            style={{ background: r.side === 'ask' ? ASK_BG : 'transparent', borderBottom: r.side === 'ask' ? '1px solid #f3f4f6' : undefined }}>
            {r.side === 'ask' && (
              <>
                <div className="absolute inset-y-0 right-0" style={{ width: `${(r.askVol / maxVol) * 100}%`, background: ASK_BAR }} />
                <span className="relative tabular-nums" style={{ color: ASK }}>{fmt(r.askVol)}</span>
              </>
            )}
          </div>
          {/* 호가 + 등락률 — 현재가와 같은 호가(최우선호가)면 테두리 */}
          <div className={`flex items-center justify-center gap-1.5 tabular-nums whitespace-nowrap${onPriceClick ? ' cursor-pointer' : ''}`}
            onClick={onPriceClick ? () => onPriceClick(r.price) : undefined}
            style={{
              background: r.side === 'ask' ? ASK_BG : BID_BG,
              borderBottom: '1px solid #f3f4f6',
              ...(r.price === currentPrice
                ? { outline: '2px solid #f59e0b', outlineOffset: '-2px', position: 'relative', zIndex: 1 }
                : {}),
            }}>
            <span className="font-semibold" style={{ color: r.side === 'ask' ? ASK : BID }}>{fmt(r.price)}</span>
            <span style={{ color: changeColor(pctOf(r.price, prevClose)) }}>{fmtPct(pctOf(r.price, prevClose))}</span>
          </div>
          {/* 매수잔량 (매수 행만) — 막대는 좌측(호가 쪽)에서 우측으로 */}
          <div className="relative flex items-center justify-start pl-2 overflow-hidden"
            style={{ background: r.side === 'bid' ? BID_BG : 'transparent', borderBottom: r.side === 'bid' ? '1px solid #f3f4f6' : undefined }}>
            {r.side === 'bid' && (
              <>
                <div className="absolute inset-y-0 left-0" style={{ width: `${(r.bidVol / maxVol) * 100}%`, background: BID_BAR }} />
                <span className="relative tabular-nums" style={{ color: BID }}>{fmt(r.bidVol)}</span>
              </>
            )}
          </div>
        </div>
      ))}

      {/* 푸터: 매도잔량합계 | 잔량합계 | 매수잔량합계 */}
      <div className="grid font-medium bg-gray-50 border-t border-gray-200" style={{ gridTemplateColumns, height: FOOTER_H }}>
        <div className="flex items-center justify-end pr-2 tabular-nums" style={{ color: ASK }}>{fmt(askTotal)}</div>
        <div className="flex items-center justify-center tabular-nums text-gray-600">잔량</div>
        <div className="flex items-center justify-start pl-2 tabular-nums" style={{ color: BID }}>{fmt(bidTotal)}</div>
      </div>
    </div>
  )
}

// ─── Canvas 기반 ──────────────────────────────────────────────────────────────

function OrderBookCanvas({ data, prevClose, currentPrice, onPriceClick }: { data: HogaData; prevClose: number; currentPrice: number; onPriceClick?: (price: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  // 캔버스는 DOM 요소가 아니라 클릭 시 y좌표로 행을 역산해 가격을 찾는다 (헤더/행/풋터 높이는 DOM과 동일)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onPriceClick) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const { rows } = buildRows(data)
    if (y < HEADER_H || y >= HEADER_H + rows.length * ROW_H) return
    const index = Math.floor((y - HEADER_H) / ROW_H)
    const row = rows[index]
    if (row) onPriceClick(row.price)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const draw = () => {
      const w = wrap.clientWidth
      if (w === 0) return
      const { rows, maxVol, askTotal, bidTotal } = buildRows(data)
      // 높이는 DOM과 동일한 공통 상수로 고정
      const headerH = HEADER_H, footerH = FOOTER_H, rowH = ROW_H
      const totalH = headerH + rows.length * rowH + footerH

      // 호가 컬럼 폭을 "호가 + 등락률" 텍스트 폭에 맞춰 가변
      const ctxM = canvas.getContext('2d')
      if (!ctxM) return
      let maxMid = 0
      for (const r of rows) {
        ctxM.font = '600 12px sans-serif'; const pw = ctxM.measureText(fmt(r.price)).width
        ctxM.font = '12px sans-serif';     const cw = ctxM.measureText(fmtPct(pctOf(r.price, prevClose))).width
        maxMid = Math.max(maxMid, pw + 6 + cw)
      }
      const midW = Math.min(w * 0.6, maxMid + 16)
      const x1 = (w - midW) / 2      // 매도잔량 ↔ 호가 경계
      const x2 = x1 + midW           // 호가 ↔ 매수잔량 경계
      const priceCenter = (x1 + x2) / 2

      const dpr = window.devicePixelRatio || 1
      // 캔버스 텍스트는 ClearType(서브픽셀)을 쓰지 않아 DOM보다 흐리다.
      // 최소 2배 해상도로 그려(슈퍼샘플링) 다운스케일하면 선명해진다.
      const scale = Math.max(2, dpr)
      const bw = Math.round(w * scale)
      const bh = Math.round(totalH * scale)
      canvas.width = bw
      canvas.height = bh
      canvas.style.width = `${w}px`
      canvas.style.height = `${totalH}px`
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(bw / w, 0, 0, bh / totalH, 0, 0)
      ctx.clearRect(0, 0, w, totalH)
      ctx.textBaseline = 'middle'

      // 헤더
      ctx.fillStyle = '#f9fafb'; ctx.fillRect(0, 0, w, headerH)
      ctx.fillStyle = '#6b7280'; ctx.font = '500 12px sans-serif'
      ctx.textAlign = 'right';  ctx.fillText('매도잔량', x1 - 8, headerH / 2)
      ctx.textAlign = 'center'; ctx.fillText('호가', priceCenter, headerH / 2)
      ctx.textAlign = 'left';   ctx.fillText('매수잔량', x2 + 8, headerH / 2)

      // 본문
      rows.forEach((r, i) => {
        const y = headerH + i * rowH
        // 값이 있는 영역(잔량 셀 + 호가 셀)만 채우고 빈 잔량 셀은 비움
        if (r.side === 'ask') {
          ctx.fillStyle = ASK_BG; ctx.fillRect(0, y, x2, rowH)         // 매도잔량 + 호가
        } else {
          ctx.fillStyle = BID_BG; ctx.fillRect(x1, y, w - x1, rowH)   // 호가 + 매수잔량
        }

        if (r.side === 'ask') {
          const bw = (r.askVol / maxVol) * x1
          ctx.fillStyle = ASK_BAR; ctx.fillRect(x1 - bw, y, bw, rowH)
          ctx.fillStyle = ASK; ctx.font = '12px sans-serif'; ctx.textAlign = 'right'
          ctx.fillText(fmt(r.askVol), x1 - 8, y + rowH / 2)
        } else {
          const bw = (r.bidVol / maxVol) * (w - x2)
          ctx.fillStyle = BID_BAR; ctx.fillRect(x2, y, bw, rowH)
          ctx.fillStyle = BID; ctx.font = '12px sans-serif'; ctx.textAlign = 'left'
          ctx.fillText(fmt(r.bidVol), x2 + 8, y + rowH / 2)
        }

        // 호가 + 등락률 (그룹을 priceCenter 중심으로 배치)
        const priceText = fmt(r.price)
        const pctText = fmtPct(pctOf(r.price, prevClose))
        ctx.font = '600 12px sans-serif'; const pw = ctx.measureText(priceText).width
        ctx.font = '12px sans-serif';     const cw = ctx.measureText(pctText).width
        const startX = priceCenter - (pw + 6 + cw) / 2
        ctx.textAlign = 'left'
        ctx.fillStyle = r.side === 'ask' ? ASK : BID; ctx.font = '600 12px sans-serif'
        ctx.fillText(priceText, startX, y + rowH / 2)
        ctx.fillStyle = changeColor(pctOf(r.price, prevClose)); ctx.font = '12px sans-serif'
        ctx.fillText(pctText, startX + pw + 6, y + rowH / 2)

        // 행 구분선 (값이 있는 영역만)
        ctx.strokeStyle = '#f3f4f6'; ctx.lineWidth = 1
        ctx.beginPath()
        if (r.side === 'ask') { ctx.moveTo(0, y + rowH); ctx.lineTo(x2, y + rowH) }
        else { ctx.moveTo(x1, y + rowH); ctx.lineTo(w, y + rowH) }
        ctx.stroke()

        // 현재가와 같은 호가(최우선호가)면 호가+등락률 컬럼(x1~x2)에만 테두리
        if (r.price === currentPrice) {
          ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2
          ctx.strokeRect(x1 + 1, y + 1, (x2 - x1) - 2, rowH - 2)
        }
      })

      // 푸터: 매도잔량합계 | 잔량합계 | 매수잔량합계
      const fy = headerH + rows.length * rowH
      ctx.fillStyle = '#f9fafb'; ctx.fillRect(0, fy, w, footerH)
      ctx.font = '500 12px sans-serif'
      ctx.fillStyle = ASK; ctx.textAlign = 'right'; ctx.fillText(fmt(askTotal), x1 - 8, fy + footerH / 2)
      ctx.fillStyle = '#6b7280'; ctx.textAlign = 'center'; ctx.fillText('잔량', priceCenter, fy + footerH / 2)
      ctx.fillStyle = BID; ctx.textAlign = 'left'; ctx.fillText(fmt(bidTotal), x2 + 8, fy + footerH / 2)

      // 헤더 하단 / 풋터 상단 가로선 (외곽 테두리는 래퍼 div가 담당)
      ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, headerH); ctx.lineTo(w, headerH)   // 헤더 아래
      ctx.moveTo(0, fy); ctx.lineTo(w, fy)             // 풋터 위
      ctx.stroke()
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [data, prevClose, currentPrice])

  return (
    <div ref={wrapRef} className="w-full border-y border-gray-200 overflow-hidden rounded-xl">
      <canvas ref={canvasRef} className={`block${onPriceClick ? ' cursor-pointer' : ''}`} onClick={handleCanvasClick} />
    </div>
  )
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export function OrderBook({ symbol, variant = 'dom', onPriceClick }: OrderBookProps) {
  // React Query — getPrice는 QuoteBoard와 같은 키라 동시/중복 요청이 dedupe된다
  const { data: httpData, isLoading } = useHoga(symbol)
  const liveHoga = useHogaWS(symbol)          // 실시간 호가 (2초마다 갱신)
  const liveQuote = useStockPriceWS(symbol)   // 호가와 같은 시점의 실시간 현재가
  const { data: priceData } = useStockPrice(symbol)
  const prevClose = priceData?.prevClose ?? 0
  // 현재가는 호가와 같은 스냅샷인 WS 값 우선 → 최우선호가(매도1/매수1)와 정확히 일치
  const currentPrice = liveQuote?.price ?? priceData?.price ?? 0

  // WS 실시간 호가 우선, 최초 로딩 동안은 HTTP 스냅샷으로 대체
  const data = liveHoga ?? httpData

  if (isLoading && !data) return <div className="text-xs text-gray-400 py-4 text-center">불러오는 중...</div>
  if (!data) return <div className="text-xs text-gray-400 py-4 text-center">호가 정보가 없습니다.</div>

  return variant === 'canvas'
    ? <OrderBookCanvas data={data} prevClose={prevClose} currentPrice={currentPrice} onPriceClick={onPriceClick} />
    : <OrderBookDom data={data} prevClose={prevClose} currentPrice={currentPrice} onPriceClick={onPriceClick} />
}
