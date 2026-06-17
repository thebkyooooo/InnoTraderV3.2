import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ─── 타입 정의 ────────────────────────────────────────────────────────────────

type Theme = 'light' | 'dark' | 'system'

interface UiState {
  /** 현재 테마 */
  theme: Theme
  /** 사이드바 접힘 여부 */
  sidebarCollapsed: boolean
  /** 모바일 사이드바 오픈 여부 */
  mobileSidebarOpen: boolean
  /** 전역 로딩 상태 */
  globalLoading: boolean
}

interface UiActions {
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  setMobileSidebarOpen: (open: boolean) => void
  setGlobalLoading: (loading: boolean) => void
}

type UiStore = UiState & UiActions

// ─── 초기 상태 ────────────────────────────────────────────────────────────────

const initialState: UiState = {
  theme: 'system',
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  globalLoading: false,
}

// ─── Zustand Store (localStorage 영속화) ─────────────────────────────────────

/**
 * UI 상태 스토어
 *
 * persist middleware로 localStorage에 저장:
 * - theme: 사용자 테마 설정 유지
 * - sidebarCollapsed: 사이드바 상태 유지
 *
 * 영속화 제외:
 * - mobileSidebarOpen: 페이지 새로고침 시 항상 닫힘
 * - globalLoading: 새로고침 시 초기화
 */
export const useUiStore = create<UiStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },

      toggleTheme: () => {
        const current = get().theme
        const next: Theme = current === 'light' ? 'dark' : 'light'
        set({ theme: next })
        applyTheme(next)
      },

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

      setGlobalLoading: (loading) => set({ globalLoading: loading }),
    }),
    {
      name: 'ui-store', // localStorage 키
      storage: createJSONStorage(() => localStorage),
      // 영속화할 상태만 선택
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
      // 스토어 수화(hydration) 후 테마 적용
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme)
        }
      },
    }
  )
)

// ─── 테마 적용 헬퍼 ──────────────────────────────────────────────────────────

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return

  const root = document.documentElement

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}

// ─── 셀렉터 ──────────────────────────────────────────────────────────────────

export const selectTheme = (state: UiStore) => state.theme
export const selectSidebarCollapsed = (state: UiStore) => state.sidebarCollapsed
export const selectMobileSidebarOpen = (state: UiStore) => state.mobileSidebarOpen
