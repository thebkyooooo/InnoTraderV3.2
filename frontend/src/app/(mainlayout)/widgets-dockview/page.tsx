'use client'
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  DockviewReact,
  type DockviewReadyEvent,
  type DockviewApi,
  type IDockviewPanelProps,
  type IDockviewHeaderActionsProps,
} from 'dockview'
import 'dockview/dist/styles/dockview.css'
import { RestartAlt, OpenInNew, CloseFullscreen, OpenInFull, GridView } from '@mui/icons-material'
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
    <div className='p-3 h-full overflow-auto bg-white'>
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
  // maximumWidth/Height가 걸린 패널(현재가 120px, 주문 400px 등)이 있으면 최대화가 깨진다:
  //  - 그 패널 그룹을 최대화하면 자기 상한에 막혀 못 커지고,
  //  - 다른 그룹을 최대화해도 숨겨진 형제 그룹의 상한이 부모 branch 집계(splitview
  //    maximumSize 합/branch min)에 그대로 남아 같은 열 전체가 400px 등으로 캡된다.
  // 그래서 최대화 동안엔 "모든" 그룹의 상한을 풀고, 복원 시 각 그룹의 명시 제약
  // 스냅샷(_explicitConstraints)을 그대로 되돌린다. setConstraints는 한 번 설정하면
  // 해제할 공식 API가 없어서(설정값이 activePanel 제약보다 우선) 내부 필드를 직접 복원한다.
  type ExplicitConstraints = Partial<Record<'minimumWidth' | 'minimumHeight' | 'maximumWidth' | 'maximumHeight', number>>
  const savedConstraintsRef = useRef<Map<string, ExplicitConstraints> | null>(null)

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

  const toggleMaximized = () => {
    type GroupWithConstraints = { _explicitConstraints?: ExplicitConstraints }
    if (maximized) {
      api.exitMaximized()
      const saved = savedConstraintsRef.current
      if (saved) {
        for (const g of containerApi.groups) {
          const snapshot = saved.get(g.id)
          if (snapshot) (g as unknown as GroupWithConstraints)._explicitConstraints = snapshot
        }
        savedConstraintsRef.current = null
      }
    } else {
      const saved = new Map<string, ExplicitConstraints>()
      for (const g of containerApi.groups) {
        saved.set(g.id, { ...(g as unknown as GroupWithConstraints)._explicitConstraints })
        g.api.setConstraints({ maximumWidth: Number.MAX_SAFE_INTEGER, maximumHeight: Number.MAX_SAFE_INTEGER })
      }
      savedConstraintsRef.current = saved
      api.maximize()
    }
  }

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
          <OpenInNew sx={{ fontSize: 18 }} />
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
          onClick={toggleMaximized}
        >
          {maximized ? <CloseFullscreen sx={{ fontSize: 18 }} /> : <OpenInFull sx={{ fontSize: 18 }} />}
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

const STORAGE_KEY_PREFIX = 'widgets-dockview-layout-v19'
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
 * 좌: 현재가 → 분석차트 → [체결/일별/투자동향] 탭
 * 중: [호가 Dom/Canvas] 탭 → 종목상세
 * 우: 주문 → [주문내역/보유주식] 탭
 */
function buildDesktop(api: DockviewApi) {
  const add = makeAddWidget(api)
  add('quote-board', { minimumHeight: 120, maximumHeight: 120 })
  add('orderbook-dom', { position: { referencePanel: 'quote-board', direction: 'right' }, minimumWidth: 300, maximumWidth: 400, minimumHeight: 300 })
  add('order-form', { position: { referencePanel: 'orderbook-dom', direction: 'right' }, minimumWidth: 300, maximumWidth: 400, minimumHeight: 300 })

  add('analysis-chart', { position: { referencePanel: 'quote-board', direction: 'below' }, minimumHeight: 280 })
  add('filled', { position: { referencePanel: 'analysis-chart', direction: 'below' }, minimumHeight: 200, maximumHeight: 400 })
  add('daily', { position: { referencePanel: 'filled', direction: 'within' }, inactive: true })
  add('trend', { position: { referencePanel: 'filled', direction: 'within' }, inactive: true })

  add('orderbook-canvas', { position: { referencePanel: 'orderbook-dom', direction: 'within' }, inactive: true })
  add('stock-detail', { position: { referencePanel: 'orderbook-dom', direction: 'below' }, minimumHeight: 300 })

  add('order-history', { position: { referencePanel: 'order-form', direction: 'below' }, minimumHeight: 300 })
  add('holdings', { position: { referencePanel: 'order-history', direction: 'within' }, inactive: true })
}

/**
 * tablet (700–1099px) — 2열 
 * 1열: [현재가/종목상세] 탭 → 분석차트 → [체결/일별/투자동향] 탭
 * 2열: 주문 → [호가 Dom/Canvas] 탭 → [주문내역/보유주식] 탭
 */
function buildTablet(api: DockviewApi) {
  const add = makeAddWidget(api)
  add('quote-board', { minimumHeight: 120, maximumHeight: 120 })
  add('order-form', { position: { referencePanel: 'quote-board', direction: 'right' }, minimumWidth: 300, maximumWidth: 400 })

  add('stock-detail', { position: { referencePanel: 'quote-board', direction: 'within' }, inactive: true })
  add('analysis-chart', { position: { referencePanel: 'quote-board', direction: 'below' }, minimumHeight: 220 })
  add('filled', { position: { referencePanel: 'analysis-chart', direction: 'below' }, minimumHeight: 260, maximumHeight: 400 })
  add('daily', { position: { referencePanel: 'filled', direction: 'within' }, inactive: true })
  add('trend', { position: { referencePanel: 'filled', direction: 'within' }, inactive: true })

  add('orderbook-dom', { position: { referencePanel: 'order-form', direction: 'below' }, minimumHeight: 120 })
  add('orderbook-canvas', { position: { referencePanel: 'orderbook-dom', direction: 'within' }, inactive: true })
  add('holdings', { position: { referencePanel: 'orderbook-dom', direction: 'below' }, minimumHeight: 260, maximumHeight: 400 })
  add('order-history', { position: { referencePanel: 'holdings', direction: 'within' }, inactive: true })
}

/**
 * mobile (<700px) — 전부 단일 컬럼으로 세로 스택(탭 없이 순서대로).
 */
function buildMobile(api: DockviewApi) {
  const add = makeAddWidget(api)
  add('quote-board', { minimumHeight: 180, maximumHeight: 220 })
  add('stock-detail', { position: { referencePanel: 'quote-board', direction: 'within' }, inactive: true })
  add('analysis-chart', { position: { referencePanel: 'quote-board', direction: 'below' }, initialHeight: 1620 })
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
  // 그룹 최대화 여부 — 최대화 중에는 래퍼의 min-height를 해제해 최대화된 그룹이
  // (1800px 전체가 아니라) 실제 보이는 영역만 채우도록 한다.
  const [maximized, setMaximized] = useState(false)

  // 최대화 토글 시 래퍼를 한 프레임 숨겼다 복원한다.
  // 이 페이지는 main 높이가 콘텐츠(래퍼) 높이에, 래퍼의 h-full이 다시 main 높이에 의존하는
  // 순환 구조라, 클래스만 바꿔서는 이전에 잡힌 높이(모바일 1800px)가 그대로 유지된다
  // (안정 상태가 두 개인 레이아웃 — DevTools에서 요소를 건드리면 그제야 재수렴하는 증상).
  // 고리를 한 프레임 끊어 새 클래스 기준의 평형값으로 재수렴시킨다. 크기 변화는 dockview
  // ResizeObserver가 감지해 내부를 재배치한다. (DataGrid.tsx의 측정 복구 트릭과 동일 계열)
  const maximizedFirstRunRef = React.useRef(true)
  useEffect(() => {
    if (maximizedFirstRunRef.current) { maximizedFirstRunRef.current = false; return }
    const el = wrapperRef.current
    if (!el) return
    const prev = el.style.display
    el.style.display = 'none'
    const raf = requestAnimationFrame(() => { el.style.display = prev })
    return () => {
      cancelAnimationFrame(raf)
      el.style.display = prev
    }
  }, [maximized])

  const onReady = (event: DockviewReadyEvent) => {
    const api = event.api
    apiRef.current = api

    const initialBp = resolveBreakpoint(api.width)
    bpRef.current = initialBp
    applyLayout(api, initialBp)

    // 최대화/복원 시 래퍼 min-height 해제·복구용 상태 동기화
    setMaximized(api.hasMaximizedGroup())
    api.onDidMaximizedGroupChange(() => setMaximized(api.hasMaximizedGroup()))

    // 레이아웃 변화(드래그 이동/리사이즈/탭 이동)를 현재 브레이크포인트 키에 저장한다.
    // 단, 최대화 중에는 저장하지 않는다 — toJSON()이 maximizedNode까지 직렬화해서
    // 새로고침/재진입 시 fromJSON이 최대화 상태로 복원되는데, 이때 constraint 해제가
    // 재적용되지 않아 최대화가 깨지고, 최대화 중 래퍼(h-full)에 맞춰 왜곡된 그리드
    // 비율이 저장돼 복구 후 배치도 망가진다. 최대화 직전의 정상 레이아웃만 유지한다.
    api.onDidLayoutChange(() => {
      if (!bpRef.current || switchingRef.current || api.hasMaximizedGroup()) return
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
          // clear+재생성 시 최대화가 풀려도 이벤트가 보장되지 않으므로 직접 동기화
          setMaximized(api.hasMaximizedGroup())
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
    setMaximized(api.hasMaximizedGroup())
  }

  return (
    <DashboardCtx.Provider value={state}>
      <div className='relative flex flex-col gap-3 w-full h-full @container'>
        <button
          type='button'
          onClick={resetLayout}
          className='h-[42px]  w-[42px] fixed top-[50%] right-[14px] z-30 flex flex-col items-center gap-1 px-0 py-[1px] text-gray-500 bg-gray-200 border border-gray-200 rounded-full shadow-md hover:text-blue-700 hover:border-blue-200'
          title='위젯 레이아웃 초기화'
        >
          <RestartAlt sx={{ fontSize: 38 }} />
          {/* <span className='text-[7px] -mt-[24px]'>리셋</span> */}
        </button>

        <div ref={wrapperRef} className={`flex-1 ${maximized ? 'h-full' : 'min-h-[1800px] @[700px]:min-h-[600px]'}`}>
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
