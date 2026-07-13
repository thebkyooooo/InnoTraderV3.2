'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  DockviewReact,
  type DockviewReadyEvent,
  type DockviewApi,
  type IDockviewPanelProps,
  type IDockviewHeaderActionsProps,
} from 'dockview'
import 'dockview/dist/styles/dockview.css'
import { RestartAlt, Launch, CloseFullscreen, FitScreen, GridView } from '@mui/icons-material'
import { useWidgetDashboardState, type WidgetDashboardState } from '@/features/dashboard/useWidgetDashboardState'
import { renderWidgetContent, WIDGET_TITLES, type WidgetId } from '@/features/dashboard/widgetContent'
import { WidgetVisibilityContext } from '@/shared/lib/widget-visibility'

const DashboardCtx = createContext<WidgetDashboardState | null>(null)

function WidgetPanel(props: IDockviewPanelProps<{ widgetId: WidgetId }>) {
  const state = useContext(DashboardCtx)
  // 콘텐츠는 항상 마운트하되(언마운트/리마운트하면 탭 전환·리사이즈마다 깜빡임),
  // 패널 가시성을 WidgetVisibilityContext로 내려 하위 데이터 훅들이 WS/REST를 게이팅한다.
  //  - 숨김 → WS 구독 해제 + REST 비활성(캐시값 유지)
  //  - 표시 → WS 재구독 + REST 재조회 (staleTime:0)
  const [visible, setVisible] = useState(() => props.api.isVisible)
  useEffect(() => {
    setVisible(props.api.isVisible)
    const disposable = props.api.onDidVisibilityChange((e) => setVisible(e.isVisible))
    return () => disposable.dispose()
  }, [props.api])

  if (!state) return null
  return (
    <div className='p-4 h-full overflow-auto bg-white'>
      <WidgetVisibilityContext.Provider value={visible}>
        {renderWidgetContent(props.params.widgetId, state)}
      </WidgetVisibilityContext.Provider>
    </div>
  )
}

const COMPONENTS = { widget: WidgetPanel }

// ─── 그룹 헤더 액션(최대화 / 플로팅) ─────────────────────────────────────────
// 각 그룹 탭바 오른쪽에 렌더된다. 최대화 상태는 dockview 전역에서 하나뿐이라
// containerApi 이벤트로, 플로팅 여부는 그룹별 location 이벤트로 동기화한다.
function GroupHeaderActions(props: IDockviewHeaderActionsProps) {
  const { api, containerApi, activePanel } = props
  const [maximized, setMaximized] = useState(() => api.isMaximized())
  const [locationType, setLocationType] = useState(() => api.location.type)

  useEffect(() => {
    setMaximized(api.isMaximized())
    setLocationType(api.location.type)
    const maxDisposable = containerApi.onDidMaximizedGroupChange(() => setMaximized(api.isMaximized()))
    const locDisposable = api.onDidLocationChange((e) => setLocationType(e.location.type))
    return () => {
      maxDisposable.dispose()
      locDisposable.dispose()
    }
  }, [api, containerApi])

  const btnClass = 'flex items-center justify-center w-6 h-full text-gray-400 hover:text-blue-600'

  return (
    <div className='flex items-center h-full px-1.5'>
      {locationType === 'grid' && !maximized && activePanel && (
        <button 
          type='button'
          className={btnClass}
          title='플로팅'
          onClick={() => containerApi.addFloatingGroup(activePanel, { x: 80, y: 80, width: 520, height: 400 })}
        >
          <Launch sx={{ fontSize: 18 }} />
        </button>
      )}
      {locationType === 'floating' && (
        <button
          type='button'
          className={btnClass}
          title='레이아웃에 도킹'
          onClick={() => api.moveTo({ position: 'right' })}
        >
          <GridView sx={{ fontSize: 16 }} />
        </button>
      )}
      {/* 최대화는 grid 그룹만 지원(플로팅/팝아웃 그룹엔 미적용) */}
      {locationType === 'grid' && (
        <button
          type='button'
          className={btnClass}
          title={maximized ? '원래 크기로' : '최대화'}
          onClick={() => (maximized ? api.exitMaximized() : api.maximize())}
        >
          {maximized ? <CloseFullscreen sx={{ fontSize: 18 }} /> : <FitScreen sx={{ fontSize: 18 }} />}
        </button>
      )}
    </div>
  )
}

// 모듈 레벨 고정 컴포넌트 — inline 화살표 함수로 넘기면 매 렌더마다 새 함수가 되어
// DockviewReact가 매번 updateOptions()를 호출하고, 그 끝에서 전체 재배치가 실행된다.
// 이 페이지는 실시간 시세로 1초마다 리렌더되므로, 그 재배치가 드래그 중인 사시(분할선)를
// 계속 원위치로 되돌리는 버그(리사이즈가 안 먹는 현상)로 나타난다.
function EmptyWatermark() {
  return <div className='p-4 text-sm text-gray-400'>빈 영역</div>
}

// ─── 반응형 브레이크포인트 ────────────────────────────────────────────────────
// dockview는 react-grid-layout 같은 내장 브레이크포인트가 없다. onReady/리사이즈 시점에
// 그리드 컨테이너 실제 폭(api.width)을 재서 desktop/tablet/mobile 배치를 직접 분기한다.
type Breakpoint = 'desktop' | 'tablet' | 'mobile'

function resolveBreakpoint(width: number): Breakpoint {
  if (width >= 1200) return 'desktop'
  if (width >= 700) return 'tablet'
  return 'mobile'
}

const STORAGE_KEY_PREFIX = 'widgets-dockview-layout-v15'
const storageKey = (bp: Breakpoint) => `${STORAGE_KEY_PREFIX}-${bp}`

type AddWidget = (
  id: WidgetId,
  options: Parameters<DockviewApi['addPanel']>[0] extends infer T ? Partial<T> : never,
) => void

function makeAddWidget(api: DockviewApi): AddWidget {
  return (id, options) =>
    api.addPanel({
      id, component: 'widget', title: WIDGET_TITLES[id], params: { widgetId: id }, ...options,
    } as Parameters<DockviewApi['addPanel']>[0])
}

/**
 * desktop (≥1100px) — 3열.
 * 좌: 현재가 → 분석차트 → [체결/일별/투자동향/주문내역/보유주식] 탭
 * 우: 주문 → [호가 Dom/Canvas/종목상세] 탭
 */
function buildDesktop(api: DockviewApi) {
  const add = makeAddWidget(api)
  add('quote-board', { minimumHeight: 120 })
  add('orderbook-dom', { position: { referencePanel: 'quote-board', direction: 'right' }, initialWidth: 680 })
  add('order-form', { position: { referencePanel: 'orderbook-dom', direction: 'right' }, initialWidth: 340 })

  add('analysis-chart', { position: { referencePanel: 'quote-board', direction: 'below' }, minimumHeight: 320, initialHeight: 500 })
  add('filled', { position: { referencePanel: 'analysis-chart', direction: 'below' }, minimumHeight: 300, initialHeight: 300 })
  add('daily', { position: { referencePanel: 'filled', direction: 'within' }, inactive: true })
  add('trend', { position: { referencePanel: 'filled', direction: 'within' }, inactive: true })

  add('orderbook-canvas', { position: { referencePanel: 'orderbook-dom', direction: 'within' }, inactive: true })
  add('stock-detail', { position: { referencePanel: 'orderbook-dom', direction: 'below' }, initialHeight: 300 })

  add('order-history', { position: { referencePanel: 'order-form', direction: 'below' }, initialHeight: 300 })
  add('holdings', { position: { referencePanel: 'order-history', direction: 'within' }, inactive: true })
}

/**
 * tablet (700–1099px) — 2열 
 * 1열: [현재가/종목상세] 탭 · 분석차트 · [체결/일별/투자동향] 탭
 * 2열: 주문 · [호가 Dom/Canvas] 탭
 */
function buildTablet(api: DockviewApi) {
  const add = makeAddWidget(api)
  add('quote-board', { minimumHeight: 120 })
  add('order-form', { position: { referencePanel: 'quote-board', direction: 'right' }, initialWidth: 320 })

  add('stock-detail', { position: { referencePanel: 'quote-board', direction: 'within' }, inactive: true })
  add('analysis-chart', { position: { referencePanel: 'quote-board', direction: 'below' }, initialHeight: 700 })
  add('filled', { position: { referencePanel: 'analysis-chart', direction: 'below' }, initialHeight: 280 })
  add('daily', { position: { referencePanel: 'filled', direction: 'within' }, inactive: true })
  add('trend', { position: { referencePanel: 'filled', direction: 'within' }, inactive: true })

  add('orderbook-dom', { position: { referencePanel: 'order-form', direction: 'below' }, initialHeight: 530 })
  add('orderbook-canvas', { position: { referencePanel: 'orderbook-dom', direction: 'within' }, inactive: true })
  add('holdings', { position: { referencePanel: 'orderbook-dom', direction: 'below' }, initialHeight: 280 })
  add('order-history', { position: { referencePanel: 'holdings', direction: 'within' }, inactive: true })
}

/**
 * mobile (<700px) — 전부 단일 컬럼으로 세로 스택(탭 없이 순서대로).
 */
function buildMobile(api: DockviewApi) {
  const add = makeAddWidget(api)
  add('quote-board', {})
  add('stock-detail', { position: { referencePanel: 'quote-board', direction: 'within' }, inactive: true })
  add('analysis-chart', { position: { referencePanel: 'quote-board', direction: 'below' }, initialHeight: 1600 })
  add('orderbook-dom', { position: { referencePanel: 'analysis-chart', direction: 'below' }, initialHeight: 1200 })
  add('orderbook-canvas', { position: { referencePanel: 'orderbook-dom', direction: 'within' }, inactive: true })
  add('order-form', { position: { referencePanel: 'orderbook-dom', direction: 'below' }, initialHeight: 800 })
  add('order-history', { position: { referencePanel: 'order-form', direction: 'within' },inactive: true })
  add('holdings', { position: { referencePanel: 'order-history', direction: 'within' }, inactive: true })
  add('filled', { position: { referencePanel: 'order-history', direction: 'below' }, initialHeight: 280 })
  add('daily', { position: { referencePanel: 'filled', direction: 'within' }, inactive: true })
  add('trend', { position: { referencePanel: 'filled', direction: 'within' }, inactive: true })
}

function buildLayout(api: DockviewApi, bp: Breakpoint) {
  if (bp === 'desktop') buildDesktop(api)
  else if (bp === 'tablet') buildTablet(api)
  else buildMobile(api)
}

/** 저장된 배치가 있으면 복원, 없으면 기본 배치 생성. */
function applyLayout(api: DockviewApi, bp: Breakpoint) {
  api.clear()
  try {
    const saved = localStorage.getItem(storageKey(bp))
    if (saved) {
      api.fromJSON(JSON.parse(saved))
      return
    }
  } catch {
    // 손상된 값이면 기본 배치로 진행
  }
  buildLayout(api, bp)
}

export default function WidgetsDockviewPage() {
  const state = useWidgetDashboardState()
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const apiRef = React.useRef<DockviewApi | null>(null)
  const bpRef = React.useRef<Breakpoint | null>(null)
  // 브레이크포인트 전환으로 배치를 교체하는 동안엔 저장 리스너가 (교체 중간 상태를) 덮어쓰지 않게 막는다.
  const switchingRef = React.useRef(false)

  const onReady = (event: DockviewReadyEvent) => {
    const api = event.api
    apiRef.current = api

    const initialBp = resolveBreakpoint(api.width)
    bpRef.current = initialBp
    applyLayout(api, initialBp)

    // 레이아웃 변화(드래그 이동/리사이즈/탭 이동)를 현재 브레이크포인트 키에 저장한다.
    api.onDidLayoutChange(() => {
      if (!bpRef.current || switchingRef.current) return
      try {
        localStorage.setItem(storageKey(bpRef.current), JSON.stringify(api.toJSON()))
      } catch {
        // storage 사용 불가 환경이면 조용히 무시
      }
    })
  }

  // 컨테이너 폭 변화는 dockview 이벤트로 통지되지 않으므로(onDidLayoutChange는 폭 변화엔
  // 안 걸림), ResizeObserver로 직접 감시해 브레이크포인트가 바뀌면 해당 배치로 교체한다.
  // 배치 교체는 clear+재생성이라 그리드가 잠깐 사라졌다 나타나므로, 리사이즈 연발 중 매번
  // 교체하면 깜빡인다. 리사이즈가 멎은 뒤 한 번만 적용하도록 디바운스.
  React.useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    let timer: ReturnType<typeof setTimeout> | null = null
    const observer = new ResizeObserver(() => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        const api = apiRef.current
        if (!api) return
        const nextBp = resolveBreakpoint(api.width)
        if (nextBp !== bpRef.current) {
          switchingRef.current = true
          bpRef.current = nextBp
          applyLayout(api, nextBp)
          switchingRef.current = false
        }
      }, 200)
    })
    observer.observe(el)
    return () => {
      if (timer) clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  const resetLayout = () => {
    const api = apiRef.current
    if (!api) return
    const bp = resolveBreakpoint(api.width)
    bpRef.current = bp
    try {
      localStorage.removeItem(storageKey(bp))
    } catch {
      // ignore
    }
    api.clear()
    buildLayout(api, bp)
  }

  return (
    <DashboardCtx.Provider value={state}>
      <div className='relative flex flex-col gap-3 w-full h-full @container'>
        <button
          type='button'
          onClick={resetLayout}
          className='h-[42px]  w-[42px] fixed top-[126px] right-[14px] z-30 flex flex-col items-center gap-1 px-0 py-[1px] text-gray-500 bg-gray-200 border border-gray-200 rounded-full shadow-md hover:text-blue-700 hover:border-blue-200'
          title='위젯 레이아웃 초기화'
        >
          <RestartAlt sx={{ fontSize: 38 }} />
          <span className='text-[7px] -mt-[24px]'>리셋</span>
        </button>

        <div ref={wrapperRef} className='flex-1 min-h-[1800px] @[700px]:min-h-[600px]'>
          <DockviewReact
            className='dockview-theme-light'
            components={COMPONENTS}
            onReady={onReady}
            watermarkComponent={EmptyWatermark}
            rightHeaderActionsComponent={GroupHeaderActions}
          />
        </div>
      </div>
    </DashboardCtx.Provider>
  )
}
