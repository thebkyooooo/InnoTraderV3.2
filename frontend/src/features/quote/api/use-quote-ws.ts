'use client'
import { useEffect, useState } from 'react'
import { Client, type StompSubscription, type IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { QuotePriceResponse, FilledQuoteItem, InvestmentTrendItem, HogaData } from './quote-api'

const WS_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/ws`

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
    const unsubs = symbols.map((sym) =>
      subscribeShared(`/topic/quote/price/${sym}`, (data) => {
        setQuotes((prev) => ({ ...prev, [sym]: data as QuotePriceResponse }))
      }),
    )
    return () => unsubs.forEach((u) => u())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return quotes
}
