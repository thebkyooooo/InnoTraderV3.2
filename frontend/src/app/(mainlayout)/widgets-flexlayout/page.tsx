'use client'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Layout, Model, type IJsonModel, type TabNode } from 'flexlayout-react'
import 'flexlayout-react/style/light.css'
import { RestartAlt, OpenInNew, CloseFullscreen, OpenInFull } from '@mui/icons-material'
import { useWidgetDashboardState, type WidgetDashboardState } from '@/features/dashboard/useWidgetDashboardState'
import { renderWidgetContent, WIDGET_TITLES, type WidgetId } from '@/features/dashboard/widgetContent'
import { WidgetVisibilityContext } from '@/shared/lib/widget-visibility'

/** 초기 배치: 좌측(현재가·차트·체결/일별/투자동향 탭) + 우측(주문·주문내역·보유주식·호가 탭·종목상세). */
function tab(id: WidgetId) {
  return { type: 'tab', name: WIDGET_TITLES[id], component: 'widget', config: { widgetId: id } }
}

/**
 * 콘텐츠는 항상 마운트하되(언마운트/리마운트하면 탭 전환·리사이즈마다 깜빡이고 다른 탭까지
 * remount 연쇄로 흔든다), 탭 가시성을 WidgetVisibilityContext로 내려 하위 데이터 훅들이
 * WS/REST를 게이팅하게 한다. — 숨김 시 WS off + REST 비활성, 표시 시 재구독 + 재조회.
 */
function WidgetTab({ node, state }: { node: TabNode; state: WidgetDashboardState }) {
  const { widgetId } = node.getConfig() as { widgetId: WidgetId }
  const [visible, setVisible] = useState(() => node.isVisible())
  useEffect(() => {
    let mounted = true
    const update = (v: boolean) => { if (mounted) setVisible(v) }
    update(node.isVisible())
    // FlexLayout은 Tab 렌더 도중 node.setVisible()을 동기 호출해 이 이벤트를 발생시키므로,
    // 렌더 중 setState 경고를 피하려 마이크로태스크로 미룬다.
    node.setEventListener('visibility', (p: { visible: boolean }) => {
      queueMicrotask(() => update(p.visible))
    })
    return () => {
      mounted = false
      node.removeEventListener('visibility')
    }
  }, [node])

  return (
    <div className='p-3 h-full overflow-auto bg-white'>
      <WidgetVisibilityContext.Provider value={visible}>
        {renderWidgetContent(widgetId, state)}
      </WidgetVisibilityContext.Provider>
    </div>
  )
}

// tabEnablePopoutFloatIcon: 탭셋 헤더에 "현재 탭 플로팅" 아이콘을 띄운다(내장 div 기반 float 창).
// tabEnablePopout(브라우저 새 창 팝아웃)은 기본 false 유지 — float 아이콘만 노출된다.
// tabEnableRenderOnDemand: false — 기본값(true)이면 비활성 탭이 "첫 선택 시점"에야 마운트되는데,
// 이때 AG Grid가 분리된(0크기) 컨테이너에서 초기화된다. 데이터가 있으면 rowData 갱신이 재그리기를
// 유발해 복구되지만, 조회 내역이 없으면 그 뒤 아무 변화가 없어 빈 그리드가 표시되지 않는 버그가 있다
// (레이아웃 초기화 후 재현). 이 페이지의 정책은 원래 "항상 마운트 + 가시성으로 WS/REST 게이팅"
// (WidgetTab 주석, dockview 페이지와 동일)이므로 on-demand를 끄고 정책을 일치시킨다.
const GLOBAL = {
  tabEnableRename: false,
  tabSetEnableMaximize: true,
  tabEnablePopoutFloatIcon: true,
  tabEnableRenderOnDemand: false,
} as const

// 내장 아이콘 교체 — dockview 페이지와 동일한 플로팅 아이콘으로 통일.
// 모듈 레벨 고정 객체: 이 페이지는 실시간 시세로 1초마다 리렌더되므로 매 렌더 새 객체를
// 넘기면 Layout이 불필요한 갱신을 반복한다.
const ICONS = {
  popoutFloat: <OpenInNew sx={{ fontSize: 18, color: '#333333B3  !important' }} />,
  maximize: <OpenInFull sx={{ fontSize: 18, color: '#333333B3  !important' }} />,
  restore: <CloseFullscreen sx={{ fontSize: 18, color: '#333333B3  !important' }} />,
}

// ─── 반응형 브레이크포인트 ────────────────────────────────────────────────────
// FlexLayout도 컨테이너 폭에 따른 내장 브레이크포인트가 없다. ResizeObserver로 래퍼 폭을
// 재서 desktop/tablet/mobile 모델을 직접 분기한다. (dockview 페이지와 동일 정책·임계값)
// 주의: 이 화면은 사이드바+여백으로 컨테이너가 뷰포트보다 약 295px 좁다(임계값은 컨테이너 폭 기준).
type Breakpoint = 'desktop' | 'tablet' | 'mobile'

function resolveBreakpoint(width: number): Breakpoint {
  if (width >= 1200) return 'desktop'
  if (width >= 700) return 'tablet'
  return 'mobile'
}

const STORAGE_KEY_PREFIX = 'widgets-flexlayout-layout-v3'
const storageKey = (bp: Breakpoint) => `${STORAGE_KEY_PREFIX}-${bp}`

// desktop (≥1100px) — 상하 2행(좌·우 컬럼 다열).
const DESKTOP_JSON: IJsonModel = {
  global: GLOBAL,
  layout: {
    type: 'row', weight: 100,
    children: [
      {
        type: 'row', weight: 70,
        children: [
          {
            type: 'row', weight: 50,
            children: [
              {
                type: 'row', weight: 60,
                children: [
                  { type: 'tabset', weight: 35, children: [tab('quote-board'), tab('stock-detail')] },
                  { type: 'tabset', weight: 75, children: [tab('filled'), tab('daily'), tab('trend')] },
                ],
              },
              {
                type: 'row', weight: 40,
                children: [
                  { type: 'tabset', weight: 30, children: [tab('orderbook-dom'), tab('orderbook-canvas')] },
                ],
              },
            ],
          },
          { type: 'tabset', weight: 50, children: [tab('analysis-chart')] },
        ],
      },
      {
        type: 'row', weight: 30,
        children: [
          { type: 'tabset', weight: 50, children: [tab('order-form')]},
          { type: 'tabset', weight: 50, children: [tab('holdings'), tab('order-history')] },
        ],
      },
    ],
  },
}

// tablet (700–1099px) — 현재는 desktop과 동일 배치(루트 가로). rootOrientationVertical를
// 넣으면 같은 트리라도 방향이 뒤집혀 다르게 렌더되므로 desktop과 맞추려면 넣지 않는다.
const TABLET_JSON: IJsonModel = {
  global: GLOBAL,
  layout: {
    type: 'row', weight: 100,
    children: [
      {
        type: 'row', weight: 65,
        children: [
          { type: 'tabset', weight: 25, children: [tab('quote-board'), tab('stock-detail')] },
          { type: 'tabset', weight: 45, children: [tab('analysis-chart')] },
          { type: 'tabset', weight: 30, children: [tab('filled'), tab('daily'), tab('trend')] },
        ],
      },
      {
        type: 'row', weight: 35,
        children: [
          { type: 'tabset', weight: 35, children: [tab('order-form')]},
          { type: 'tabset', weight: 30, children: [tab('orderbook-dom'), tab('orderbook-canvas')] },
          { type: 'tabset', weight: 35, children: [tab('order-history'), tab('holdings')] },
        ],
      },
    ],
  },
}

// mobile (<700px) — 세로 루트: 전 위젯을 단일 컬럼으로 스택.
const MOBILE_JSON: IJsonModel = {
  global: { ...GLOBAL, rootOrientationVertical: true },
  layout: {
    type: 'row', weight: 100,
    children: [
      { type: 'tabset', weight: 9, children: [tab('quote-board'), tab('stock-detail')] },
      { type: 'tabset', weight: 14, children: [tab('order-form')] },
      { type: 'tabset', weight: 16, children: [tab('orderbook-dom'), tab('orderbook-canvas')] },
      { type: 'tabset', weight: 16, children: [tab('holdings'), tab('order-history')] },
      { type: 'tabset', weight: 16, children: [tab('analysis-chart')] },
      { type: 'tabset', weight: 14, children: [tab('filled'), tab('daily'), tab('trend')] },
    ],
  },
}

const DEFAULT_JSONS: Record<Breakpoint, IJsonModel> = {
  desktop: DESKTOP_JSON,
  tablet: TABLET_JSON,
  mobile: MOBILE_JSON,
}

function loadModel(bp: Breakpoint): Model {
  try {
    const saved = localStorage.getItem(storageKey(bp))
    if (saved) {
      const json = JSON.parse(saved) as IJsonModel
      // 저장된 레이아웃엔 저장 당시의 global 설정이 통째로 들어 있어, 이후 코드에서
      // 추가한 플래그(예: tabEnablePopoutFloatIcon)가 반영되지 않는다. 코드 쪽 GLOBAL을
      // 병합해 강제한다. (rootOrientationVertical 등 저장본 고유 값은 유지)
      json.global = { ...json.global, ...GLOBAL }
      return Model.fromJson(json)
    }
  } catch {
    // 손상된 값이면 기본 배치로 진행
  }
  return Model.fromJson(DEFAULT_JSONS[bp])
}

export default function WidgetsFlexLayoutPage() {
  const dashboardState = useWidgetDashboardState()
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const [model, setModel] = useState<Model | null>(null)
  const bpRef = React.useRef<Breakpoint | null>(null)

  // 마운트 시 현재 컨테이너 폭으로 초기 브레이크포인트 결정 후 모델 로드.
  useEffect(() => {
    const width = wrapperRef.current?.clientWidth ?? window.innerWidth
    const bp = resolveBreakpoint(width)
    bpRef.current = bp
    setModel(loadModel(bp))
  }, [])

  // 컨테이너 폭 변화를 감시해 브레이크포인트가 바뀌면 해당 모델로 교체한다.
  // 모델 교체는 FlexLayout 전체 remount를 유발하므로(그리드가 잠깐 사라졌다 나타남),
  // 리사이즈 연발 중 매번 교체하면 심하게 깜빡인다. 리사이즈가 멎은 뒤 한 번만 적용하도록 디바운스.
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    let timer: ReturnType<typeof setTimeout> | null = null
    const observer = new ResizeObserver(() => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        const nextBp = resolveBreakpoint(el.clientWidth)
        if (nextBp !== bpRef.current) {
          bpRef.current = nextBp
          setModel(loadModel(nextBp))
        }
      }, 200)
    })
    observer.observe(el)
    return () => {
      if (timer) clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  const persist = useCallback((m: Model) => {
    if (!bpRef.current) return
    try {
      localStorage.setItem(storageKey(bpRef.current), JSON.stringify(m.toJson()))
    } catch {
      // storage 사용 불가 환경이면 조용히 무시
    }
  }, [])

  const resetLayout = () => {
    const bp = bpRef.current ?? 'desktop'
    try {
      localStorage.removeItem(storageKey(bp))
    } catch {
      // ignore
    }
    setModel(Model.fromJson(DEFAULT_JSONS[bp]))
  }

  // factory는 탭마다 호출되므로 최신 dashboardState를 참조하도록 매 렌더마다 재생성한다.
  const factory = useMemo(() => (node: TabNode) => (
    <WidgetTab node={node} state={dashboardState} />
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [dashboardState])

  return (
    <div className='relative flex flex-col gap-3 w-full h-full'>
      <button
        type='button'
        onClick={resetLayout}
        className='h-[42px]  w-[42px] fixed top-[25%] right-[14px] z-30 flex flex-col items-center gap-1 px-0 py-[1px] text-gray-500 bg-gray-200 border border-gray-200 rounded-full shadow-md hover:text-blue-700 hover:border-blue-200'
        title='위젯 레이아웃 초기화'
      >
        <RestartAlt sx={{ fontSize: 38 }} />
        <span className='text-[7px] -mt-[24px]'>리셋</span>
      </button>

      <div ref={wrapperRef} className='flex-1 min-h-[1800px] @[700px]:min-h-[600px] relative'>
        {model && (
          <Layout
            model={model}
            factory={factory}
            onModelChange={persist}
            constrainFloatPanels
            icons={ICONS}
          />
        )}
      </div>
    </div>
  )
}
