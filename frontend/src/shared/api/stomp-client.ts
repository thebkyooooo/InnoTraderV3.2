import { Client, type StompSubscription, type IMessage, type StompHeaders } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

// auth-store에서 AT를 읽어오는 함수 (동적 주입)
let getAccessToken: (() => string | null) | null = null

export function registerStompAuth(getter: () => string | null) {
  getAccessToken = getter
}

// ─── 연결 상태 타입 ───────────────────────────────────────────────────────────

export type StompConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

type ConnectionCallback = (state: StompConnectionState) => void

// ─── STOMP 싱글톤 클라이언트 ──────────────────────────────────────────────────

class StompClientManager {
  private client: Client | null = null
  private connectionState: StompConnectionState = 'disconnected'
  private connectionCallbacks: Set<ConnectionCallback> = new Set()
  private reconnectDelay = 5_000 // 5초 후 재연결
  private maxReconnectAttempts = 5
  private reconnectAttempts = 0

  private getWsUrl(): string {
    return process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:8080/ws'
  }

  private setConnectionState(state: StompConnectionState) {
    this.connectionState = state
    this.connectionCallbacks.forEach((cb) => cb(state))
  }

  /**
   * WebSocket 연결 시작
   * Spring Security WebSocket 인증을 위해 CONNECT 프레임 헤더에 AT 포함
   */
  connect(): Promise<void> {
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      this.setConnectionState('connecting')

      this.client = new Client({
        // SockJS 팩토리 함수 사용
        webSocketFactory: () =>
          new SockJS(this.getWsUrl()) as unknown as WebSocket,

        // 최초 연결 + 매 재연결 시도 직전마다 호출 — 토큰을 connect() 시점에 한 번만 캡처하면
        // 자동 재연결이 만료/부재 상태의 낡은 헤더로 CONNECT를 반복해 서버에서 계속 거부된다.
        beforeConnect: () => {
          const token = getAccessToken?.()
          if (this.client) {
            this.client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {}
          }
        },

        // 재연결 딜레이
        reconnectDelay: this.reconnectDelay,

        onConnect: () => {
          this.reconnectAttempts = 0
          this.setConnectionState('connected')
          resolve()
        },

        onDisconnect: () => {
          this.setConnectionState('disconnected')
        },

        onStompError: (frame) => {
          console.error('[STOMP] Error:', frame.headers['message'])
          this.setConnectionState('error')
          reject(new Error(frame.headers['message'] ?? 'STOMP connection error'))
        },

        onWebSocketError: (event) => {
          console.error('[STOMP] WebSocket error:', event)
          this.setConnectionState('error')
          this.reconnectAttempts++
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.client?.deactivate()
          }
        },

        // 디버그 로그 (개발 환경에서만)
        debug: process.env.NODE_ENV === 'development'
          ? (msg) => console.debug('[STOMP]', msg)
          : undefined,
      })

      this.client.activate()
    })
  }

  /**
   * STOMP 토픽 구독
   * @param destination - 구독 경로 (예: /topic/price/AAPL)
   * @param callback - 메시지 수신 콜백
   * @returns StompSubscription (구독 해제 시 .unsubscribe() 호출)
   */
  subscribe(
    destination: string,
    callback: (message: IMessage) => void
  ): StompSubscription | null {
    if (!this.client || this.connectionState !== 'connected') {
      console.warn('[STOMP] subscribe() called before connection established:', destination)
      return null
    }
    return this.client.subscribe(destination, callback)
  }

  /**
   * STOMP 메시지 발행 (주문 등)
   */
  publish(destination: string, body: unknown, headers?: StompHeaders): void {
    if (!this.client || this.connectionState !== 'connected') {
      console.warn('[STOMP] publish() called before connection established')
      return
    }
    this.client.publish({
      destination,
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers,
    })
  }

  /**
   * 연결 해제
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.deactivate()
      this.client = null
    }
    this.setConnectionState('disconnected')
  }

  /**
   * 연결 상태 변경 리스너 등록
   */
  onConnectionStateChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback)
    // 즉시 현재 상태 전달
    callback(this.connectionState)
    // 구독 해제 함수 반환
    return () => this.connectionCallbacks.delete(callback)
  }

  getConnectionState(): StompConnectionState {
    return this.connectionState
  }

  isConnected(): boolean {
    return this.connectionState === 'connected'
  }
}

// 싱글톤 인스턴스 export
export const stompClient = new StompClientManager()
