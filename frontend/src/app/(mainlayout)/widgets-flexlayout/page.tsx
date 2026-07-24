'use client'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Layout, Model, Actions, TabSetNode, DockLocation, type IJsonModel, type TabNode } from 'flexlayout-react'
import 'flexlayout-react/style/light.css'
import { RestartAlt, OpenInNew, CloseFullscreen, OpenInFull, Add } from '@mui/icons-material'
import { useWidgetDashboardState, type WidgetDashboardState } from '@/features/dashboard/useWidgetDashboardState'
import { renderWidgetContent, WIDGET_TITLES, WIDGET_IDS, type WidgetId } from '@/features/dashboard/widgetContent'
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

const STORAGE_KEY_PREFIX = 'widgets-flexlayout-layout-v4'
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
          { type: 'tabset', weight: 50, children: [tab('order-history'), tab('holdings')] },
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
      { type: 'tabset', weight: 16, children: [tab('order-history'), tab('holdings')] },
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

// 레이아웃 트리에서 최대화 플래그를 제거한다. 최대화는 일시적 보기 상태라 저장하지
// 않는다(dockview 페이지와 동일 정책) — 저장/복원 양쪽에서 제거해 새로고침·재진입 시
// 항상 일반 배치로 시작하고, 이전 버전이 저장해둔 maximized도 무시한다.
function stripMaximized(node: { maximized?: boolean; children?: unknown[] }) {
  delete node.maximized
  node.children?.forEach((c) => stripMaximized(c as { maximized?: boolean; children?: unknown[] }))
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
      stripMaximized(json.layout)
      return Model.fromJson(json)
    }
  } catch {
    // 손상된 값이면 기본 배치로 진행
  }
  return Model.fromJson(DEFAULT_JSONS[bp])
}

// 위젯 추가 시 대상 탭셋 결정: 마지막으로 활성화된 탭셋을 우선하고, 아직 아무 탭셋도
// 클릭되지 않아 활성 탭셋이 없으면 트리에서 처음 만나는 탭셋으로 폴백한다.
function targetTabSetId(model: Model): string | undefined {
  const active = model.getActiveTabset()
  if (active) return active.getId()
  let id: string | undefined
  model.visitNodes((node) => {
    if (!id && node instanceof TabSetNode) id = node.getId()
  })
  return id
}

export default function WidgetsFlexLayoutPage() {
  const dashboardState = useWidgetDashboardState()
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const [model, setModel] = useState<Model | null>(null)
  const bpRef = React.useRef<Breakpoint | null>(null)
  // 탭셋 최대화 여부 — 최대화 중에는 래퍼의 min-height를 해제해 최대화된 탭이
  // (1800px 전체가 아니라) 실제 보이는 영역만 채우도록 한다.
  const [maximized, setMaximized] = useState(false)
  // 위젯 추가 드롭다운 열림 상태 + 바깥 클릭 감지용 ref.
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const addMenuRef = React.useRef<HTMLDivElement>(null)

  // 마운트 시 현재 컨테이너 폭으로 초기 브레이크포인트 결정 후 모델 로드.
  useEffect(() => {
    const width = wrapperRef.current?.clientWidth ?? window.innerWidth
    const bp = resolveBreakpoint(width)
    bpRef.current = bp
    setModel(loadModel(bp))
  }, [])

  // 모델 교체(브레이크포인트 전환·리셋) 직후, FlexLayout이 새 탭셋의 콘텐츠 rect를 확정하기 전에
  // 마운트된 탭 콘텐츠(AG Grid 등)가 빈 화면으로 고착되는 경우가 있다. 탭 콘텐츠는 탭셋의 실측
  // rect(getContentRect)를 렌더 시점에 읽어 배치되므로, 다른 탭을 선택했다가 원래 탭을 재선택하면
  // 그 시점의 올바른 rect로 다시 그려져 복구된다(수동 복구 경로). 이를 레이아웃 계산이 끝난 뒤
  // 프로그램으로 재현한다 — 두 액션이 같은 태스크에서 연속 dispatch되어 화면 깜빡임은 없다.
  useEffect(() => {
    if (!model) return
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        model.visitNodes((node) => {
          if (node instanceof TabSetNode) {
            const selected = node.getSelectedNode()
            const other = node.getChildren().find((c) => c !== selected)
            if (selected && other) {
              model.doAction(Actions.selectTab(other.getId()))
              model.doAction(Actions.selectTab(selected.getId()))
            }
          }
        })
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [model])

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
      const json = m.toJson()
      stripMaximized(json.layout)
      localStorage.setItem(storageKey(bpRef.current), JSON.stringify(json))
    } catch {
      // storage 사용 불가 환경이면 조용히 무시
    }
  }, [])

  // 최대화/복원 액션도 onModelChange로 들어오므로 여기서 최대화 상태를 함께 갱신한다.
  const handleModelChange = useCallback((m: Model) => {
    setMaximized(m.getMaximizedTabset() !== undefined)
    persist(m)
  }, [persist])

  // 모델 교체(브레이크포인트 전환·리셋·저장본 복원) 시에도 최대화 상태를 동기화한다.
  // (저장/복원 시 maximized는 stripMaximized로 제거되므로 사실상 false로 리셋)
  useEffect(() => {
    setMaximized(model?.getMaximizedTabset() !== undefined)
  }, [model])

  // 최대화 토글 시 래퍼를 한 프레임 숨겼다 복원한다.
  // 이 페이지는 main 높이가 콘텐츠(래퍼) 높이에, 래퍼의 h-full이 다시 main 높이에 의존하는
  // 순환 구조라, 클래스만 바꿔서는 이전에 잡힌 높이(모바일 1800px)가 그대로 유지된다
  // (안정 상태가 두 개인 레이아웃 — DevTools에서 요소를 건드리면 그제야 재수렴하는 증상).
  // 고리를 한 프레임 끊어 새 클래스 기준의 평형값으로 재수렴시킨다.
  const maximizedFirstRunRef = React.useRef(true)
  useEffect(() => {
    if (maximizedFirstRunRef.current) { maximizedFirstRunRef.current = false; return }
    const el = wrapperRef.current
    if (!el || !model) return
    const prev = el.style.display
    let raf2 = 0
    el.style.display = 'none'
    const raf = requestAnimationFrame(() => {
      el.style.display = prev
      // 숨김 프레임 동안 FlexLayout이 탭 콘텐츠 rect를 0으로 측정해 고착하는 경우가 있다
      // (프로덕션 빌드에서 재현 — updateRect는 루트 rect가 그대로면 재배치를 건너뛰므로
      // 창을 실제로 리사이즈하기 전까지 콘텐츠가 0x0으로 안 보이는 증상).
      // 표시 복원 다음 프레임에 no-op 모델 액션으로 강제 redraw해 재측정시킨다.
      raf2 = requestAnimationFrame(() => {
        model.doAction(Actions.updateModelAttributes({}))
      })
    })
    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(raf2)
      el.style.display = prev
    }
  }, [maximized, model])

  // 위젯을 활성(없으면 첫) 탭셋에 새 탭으로 추가한다. 중복 허용 정책이라 id는 지정하지
  // 않고 FlexLayout이 자동 부여하게 둔다(같은 위젯 여러 개 가능). select=true로 추가 즉시
  // 선택 → 탭 가시성이 켜져 WidgetTab이 곧바로 마운트·구독된다. 추가는 onModelChange를
  // 발생시키므로 persist로 자동 저장된다.
  const addWidget = (id: WidgetId) => {
    if (!model) return
    const targetId = targetTabSetId(model)
    if (!targetId) return
    model.doAction(Actions.addTab(tab(id), targetId, DockLocation.CENTER, -1, true))
    setAddMenuOpen(false)
  }

  // 드롭다운 바깥을 클릭하면 닫는다.
  useEffect(() => {
    if (!addMenuOpen) return
    const onPointerDown = (e: PointerEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) setAddMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [addMenuOpen])

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
      <div ref={addMenuRef} className='fixed top-[calc(50%-50px)] right-[14px] z-30'>
        <button
          type='button'
          onClick={resetLayout}
          className='h-[42px] w-[42px] z-30 flex flex-col items-center gap-1 px-0 py-[1px] text-gray-500 bg-gray-200 border border-gray-200 rounded-full shadow-md hover:border-gray-200 hover:bg-gray-300'
          title='위젯 레이아웃 초기화'
        >
          <RestartAlt sx={{ fontSize: 38 }} />
          {/* <span className='text-[8px] -mt-[26px]'>리셋</span> */}
        </button>

        <button
          type='button'
          onClick={() => setAddMenuOpen((o) => !o)}
          className='h-[42px] w-[42px] mt-2 flex flex-col items-center gap-1 px-0 pt-1 text-gray-500 bg-gray-200 border border-gray-200 rounded-full shadow-md hover:border-gray-200 hover:bg-gray-300'
          title='위젯 추가'
        >
          <Add sx={{ fontSize: 32 }} />
          {/* <span className='text-[8px] -mt-[25px]'>추가</span> */}
        </button>
        {addMenuOpen && (
          <div className='absolute top-[-100px] right-[50px] w-36 max-h-[60vh] overflow-auto bg-white border border-gray-200 rounded-md shadow-lg py-2'>
            <p className='mx-3 mb-2 py-1.5 text-xs font-semibold text-gray-700 border-b border-gray-200'>윗젯 추가</p>
            {WIDGET_IDS.map((id) => (
              <button
                key={id}
                type='button'
                onClick={() => addWidget(id)}
                className='block w-full text-left px-3.5 py-1 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              >
                {WIDGET_TITLES[id]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={wrapperRef} className={`flex-1 relative ${maximized ? 'h-full' : 'min-h-[1800px] @[700px]:min-h-[600px]'}`}>
        {model && (
          <Layout
            model={model}
            factory={factory}
            onModelChange={handleModelChange}
            constrainFloatPanels
            icons={ICONS}
          />
        )}
      </div>
    </div>
  )
}
