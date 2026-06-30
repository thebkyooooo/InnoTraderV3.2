import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { setRealtimeEnabled } from '@/features/quote/api/use-quote-ws'

// ─── 전역 실시간 시세 on/off ──────────────────────────────────────────────────
// 헤더 토글로 앱 전체 실시간 시세(현재가/체결/호가/투자동향/관심종목)를 켜고 끈다.
// OFF 시 공유 WS 구독을 해제해 서버 broadcast·네트워크 트래픽을 멈춘다(연결은 유지).
// 설정은 localStorage 에 영속화한다.

interface RealtimeState {
  enabled: boolean
  toggle: () => void
  setEnabled: (on: boolean) => void
}

export const useRealtimeStore = create<RealtimeState>()(
  persist(
    (set, get) => ({
      enabled: true,
      toggle: () => {
        const on = !get().enabled
        setRealtimeEnabled(on)
        set({ enabled: on })
      },
      setEnabled: (on) => {
        setRealtimeEnabled(on)
        set({ enabled: on })
      },
    }),
    {
      name: 'realtime-store',
      storage: createJSONStorage(() => localStorage),
      // 저장된 설정을 WS 레이어에 반영(새로고침 시 OFF 상태 복원)
      onRehydrateStorage: () => (state) => {
        if (state) setRealtimeEnabled(state.enabled)
      },
    }
  )
)
