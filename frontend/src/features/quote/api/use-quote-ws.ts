'use client'
import { useEffect, useState } from 'react'
import { Client, type StompSubscription, type IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { QuotePriceResponse, FilledQuoteItem, InvestmentTrendItem, HogaData } from './quote-api'
import type { IndexInfo, ExchangeRate } from '@/features/market/api/market-api'

// WS 는 백엔드 도메인을 직접 가리켜야 한다. HTTP(/api/*)는 next.config rewrites 로 프록시되지만
// WebSocket 업그레이드는 rewrites 가 프록시하지 못하므로, 상대경로(빈 base)면 프론트로 잘못 연결된다.
// 주문용 stomp-client 와 동일하게 NEXT_PUBLIC_WS_URL(백엔드 도메인/ws)을 사용한다.
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:8080/ws'

// ─── 시세 전용 공유 WebSocket ─────────────────────────────────────────────────
// 현재가/체결/투자동향 토픽(모두 public)을 단일 연결로 공유한다. 같은 토픽을 여러 컴포넌트가
// 구독해도 WS 연결 1개·STOMP 구독 1개만 유지하고 수신 메시지를 리스너들에게 fan-out 한다.
//
// 구독 해제는 "지연 삭제"로 처리한다: listener 가 0이 되어도 즉시 unsubscribe 하지 않고
// 잠깐 기다린다. React StrictMode 이중 실행이나 탭 전환에서는 곧바로 같은 채널을 재구독하므로,
// 그 사이 예약된 삭제를 취소해 구독이 깜빡이지 않게 한다. 연결 자체는 한 번 맺으면 유지한다.

type Listener = (data: unknown) => void
interface Channel {
  sub: StompSubscription | null
  listeners: Set<Listener>
  last: unknown
  removeTimer: ReturnType<typeof setTimeout> | null
}

const channels = new Map<string, Channel>()
let client: Client | null = null
let connected = false
let realtimeEnabled = true   // 전역 실시간 on/off (OFF 시 모든 구독 해제)

function doSubscribe(destination: string, ch: Channel): StompSubscription | null {
  if (!client || !connected) return null
  return client.subscribe(destination, (msg: IMessage) => {
    try {
      const data = JSON.parse(msg.body)
      ch.last = data
      ch.listeners.forEach((l) => l(data))
    } catch {
      // ignore malformed frames
    }
  })
}

function ensureClient() {
  if (client) return
  client = new Client({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webSocketFactory: () => new SockJS(WS_URL) as any,
    reconnectDelay: 5000,
    onConnect: () => {
      connected = true
      // 최초/재연결 시 활성 채널을 (재)구독해 끊김 후에도 복구되게 한다. (실시간 OFF면 구독하지 않음)
      if (realtimeEnabled) channels.forEach((ch, dest) => { ch.sub = doSubscribe(dest, ch) })
    },
    onWebSocketClose: () => { connected = false },
  })
  client.activate()
}

function subscribeShared(destination: string, listener: Listener): () => void {
  ensureClient()
  let ch = channels.get(destination)
  if (!ch) {
    ch = { sub: null, listeners: new Set(), last: null, removeTimer: null }
    channels.set(destination, ch)
    if (connected && realtimeEnabled) ch.sub = doSubscribe(destination, ch)
  } else if (ch.removeTimer) {
    clearTimeout(ch.removeTimer)   // 예약된 삭제 취소 (재구독)
    ch.removeTimer = null
  }
  ch.listeners.add(listener)
  if (ch.last != null) listener(ch.last)   // 늦게 합류한 컴포넌트에 최신값 즉시 전달

  return () => {
    const c = channels.get(destination)
    if (!c) return
    c.listeners.delete(listener)
    if (c.listeners.size === 0 && !c.removeTimer) {
      // 즉시 끊지 않고 지연 — StrictMode 이중/탭 전환이면 곧 재구독되어 위에서 취소된다.
      c.removeTimer = setTimeout(() => {
        if (c.listeners.size === 0) {
          c.sub?.unsubscribe()
          c.sub = null
          channels.delete(destination)
        }
      }, 2000)
    }
  }
}

function useChannel<T>(destination: string | null): T | null {
  const [data, setData] = useState<T | null>(null)
  useEffect(() => {
    if (!destination) return
    setData(null)
    return subscribeShared(destination, (d) => setData(d as T))
  }, [destination])
  return data
}

// ─── 전역 실시간 on/off ───────────────────────────────────────────────────────

/**
 * 전역 실시간 토글. OFF면 모든 활성 구독을 해제(서버 broadcast 중단)하고, ON이면 재구독한다.
 * WS 연결 자체는 유지하므로 토글이 즉시 반영된다. (구독 채널이 없으면 다음 구독 때 적용)
 */
export function setRealtimeEnabled(on: boolean): void {
  realtimeEnabled = on
  if (on) {
    if (channels.size > 0) {
      ensureClient()
      if (connected) channels.forEach((ch, dest) => { if (!ch.sub) ch.sub = doSubscribe(dest, ch) })
    }
  } else {
    channels.forEach((ch) => { ch.sub?.unsubscribe(); ch.sub = null })
  }
}

// ─── 토픽별 훅 ────────────────────────────────────────────────────────────────

/**
 * 실시간 현재가 (/topic/quote/price/{symbol}).
 * enabled=false 이면 구독하지 않는다 (제어형 컴포넌트용).
 */
export function useStockPriceWS(symbol: string, enabled = true): QuotePriceResponse | null {
  return useChannel<QuotePriceResponse>(enabled && symbol ? `/topic/quote/price/${symbol}` : null)
}

/** 실시간 체결 (/topic/quote/filled/{symbol}). */
export function useFilledWS(symbol: string, enabled = true): FilledQuoteItem | null {
  return useChannel<FilledQuoteItem>(enabled && symbol ? `/topic/quote/filled/${symbol}` : null)
}

/** 실시간 투자동향 (/topic/quote/trend/{symbol}). */
export function useTrendWS(symbol: string, enabled = true): InvestmentTrendItem | null {
  return useChannel<InvestmentTrendItem>(enabled && symbol ? `/topic/quote/trend/${symbol}` : null)
}

/** 실시간 호가 (/topic/quote/hoga/{symbol}). */
export function useHogaWS(symbol: string, enabled = true): HogaData | null {
  return useChannel<HogaData>(enabled && symbol ? `/topic/quote/hoga/${symbol}` : null)
}

/** 실시간 글로벌 지수 전체 (/topic/market/index). 구독 종목 무관 고정 채널(지수 8개 배열). */
export function useIndexWS(enabled = true): IndexInfo[] | null {
  return useChannel<IndexInfo[]>(enabled ? '/topic/market/index' : null)
}

/** 실시간 환율 전체 (/topic/market/exchange). 구독 종목 무관 고정 채널(환율 5개 배열). */
export function useExchangeWS(enabled = true): ExchangeRate[] | null {
  return useChannel<ExchangeRate[]>(enabled ? '/topic/market/exchange' : null)
}

/** 계좌 활동 알림 (주문 접수/정정/취소/체결) — 페이로드에 최신 데이터를 싣지 않는 "갱신 신호". */
export interface AccountActivityMessage {
  accountNo: string
  orderNo: string
  symbol: string
  reason: 'ORDER_RECEIVED' | 'ORDER_AMENDED' | 'ORDER_CANCELED' | 'ORDER_FILLED'
  at: string
}

/**
 * 계좌 활동 실시간 알림 (/topic/account/activity/{accountNo}).
 * 주문내역/보유종목이 서버에서 변경될 때마다(접수·정정·취소·체결) 신호만 전달한다 —
 * 수신 시 해당 react-query를 invalidate해 재조회하는 용도로 사용한다(최신 데이터는 REST가 단일 진실 소스).
 */
export function useAccountActivityWS(accountNo: string, enabled = true): AccountActivityMessage | null {
  return useChannel<AccountActivityMessage>(enabled && accountNo ? `/topic/account/activity/${accountNo}` : null)
}

/**
 * 여러 종목의 실시간 현재가 (관심종목 등 목록 화면용).
 * symbols 각각의 /topic/quote/price/{symbol} 를 공유 연결로 구독하고
 * { symbol → 시세 } 맵으로 반환한다.
 */
export function useStockPricesWS(symbols: string[]): Record<string, QuotePriceResponse> {
  const [quotes, setQuotes] = useState<Record<string, QuotePriceResponse>>({})
  // symbols 배열 참조는 매 렌더 바뀌므로 정렬된 문자열을 deps 로 써 내용이 같으면 재구독하지 않는다.
  const key = [...symbols].sort().join(',')

  useEffect(() => {
    if (symbols.length === 0) { setQuotes({}); return }

    // 심볼마다 개별 setQuotes를 호출하면 심볼 수가 많은 화면(랭킹 등)에서 한 브로드캐스트
    // 주기에 수십~수백 번의 연쇄 리렌더가 발생해 React의 "Maximum update depth" 한도에
    // 걸릴 수 있다. 같은 틱에 도착한 업데이트를 버퍼에 모았다가 마이크로태스크 1회로 flush한다.
    const buffer: Record<string, QuotePriceResponse> = {}
    let flushScheduled = false
    const flush = () => {
      flushScheduled = false
      const updates = buffer as Record<string, QuotePriceResponse>
      const snapshot = { ...updates }
      for (const k of Object.keys(updates)) delete updates[k]
      setQuotes((prev) => ({ ...prev, ...snapshot }))
    }

    const unsubs = symbols.map((sym) =>
      subscribeShared(`/topic/quote/price/${sym}`, (data) => {
        buffer[sym] = data as QuotePriceResponse
        if (!flushScheduled) {
          flushScheduled = true
          queueMicrotask(flush)
        }
      }),
    )
    return () => unsubs.forEach((u) => u())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return quotes
}
