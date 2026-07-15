'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef, RowClickedEvent, BodyScrollEndEvent, GridApi, GridReadyEvent } from 'ag-grid-community'
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community'
import Box from '@mui/material/Box'

ModuleRegistry.registerModules([AllCommunityModule])

// 모든 행/헤더 보더 색상을 통일하고 교차행 배경(zebra)을 제거해 보더가 일정하게 보이도록 함
const BORDER = '#eeeeee'
const gridTheme = themeQuartz.withParams({
  borderColor: BORDER,
  rowBorder: { style: 'solid', width: 1, color: BORDER },
  headerRowBorder: { style: 'solid', width: 1, color: BORDER },
  wrapperBorder: false, // 외곽 보더는 Box가 담당
  oddRowBackgroundColor: 'transparent',
  rangeSelectionBorderColor: 'transparent', // 셀 클릭 시 생기는 포커스 테두리 제거
})

interface DataGridProps<TData = Record<string, unknown>> {
  rows: TData[]
  columnDefs: ColDef<TData>[]
  height?: number | string
  loading?: boolean
  onRowClick?: (row: TData) => void
  onScrollEnd?: () => void
  pagination?: boolean
  pageSize?: number
  headerHeight?: number
  rowHeight?: number
  /** 선택 체크박스 컬럼 표시 여부 (기본: onRowClick 지정 시 true). 클릭만 필요하고 체크박스가 불필요하면 false */
  showSelectionColumn?: boolean
  /** 선택 체크박스 컬럼 헤더 타이틀 (onRowClick 사용 시에만 표시) */
  selectionHeaderName?: string
  /** 선택 체크박스 컬럼 너비(px). 미지정 시 AG Grid 기본(~50px) */
  selectionColumnWidth?: number
  /** 행 고유 ID 추출자. 지정하면 rowData 갱신 시 행을 재사용해 스크롤/선택을 유지한다(실시간 갱신용). */
  getRowId?: (row: TData) => string
}

export function DataGrid<TData = Record<string, unknown>>({
  rows,
  columnDefs,
  height = 400,
  loading = false,
  onRowClick,
  onScrollEnd,
  pagination = false,
  pageSize = 20,
  headerHeight = 38,
  rowHeight = 36,
  showSelectionColumn = true,
  selectionHeaderName,
  selectionColumnWidth,
  getRowId,
}: DataGridProps<TData>) {
  const selectable = !!onRowClick && showSelectionColumn
  const gridApiRef = useRef<GridApi<TData> | null>(null)
  const rowsRef = useRef(rows)
  rowsRef.current = rows
  const columnDefsRef = useRef(columnDefs)
  columnDefsRef.current = columnDefs
  const loadingRef = useRef(loading)
  loadingRef.current = loading
  const containerRef = useRef<HTMLDivElement>(null)

  const forceRelayout = useCallback((api: GridApi<TData>) => {
    // FlexLayout처럼 컨테이너를 늦게(마운트 커밋 이후) 픽셀 크기로 확정하는 레이아웃에서는,
    // 그리드가 실제로 리사이즈된 적이 없다고 내부적으로 판단해 가로 스크롤 필요 여부/컬럼
    // 뷰포트 폭 계산을 아예 건너뛴 채로 고착되는 경우가 있다("ag-body-horizontal-content-no-gap"
    // 클래스와 가로 스크롤바가 끝내 생기지 않음). columnDefs를 그대로 재설정해 컬럼/뷰포트
    // 레이아웃을 처음부터 다시 계산하게 강제한다(폭 값 자체는 동일하므로 시각적 컬럼 크기는
    // 바뀌지 않는다).
    api.setGridOption('columnDefs', columnDefsRef.current)
    if (rowsRef.current.length === 0) {
      // rowData가 빈 배열 → 빈 배열로만 바뀌면 "행 개수 변화 없음"으로 보고 오버레이 위치
      // 재계산을 건너뛰므로, "조회된 데이터가 없습니다" 오버레이를 직접 다시 띄운다.
      // 단 loading 중에는 오버레이를 loading prop이 관리하므로 건드리지 않는다
      // (v32+에서 hideOverlay가 로딩 오버레이를 숨기지 못한다는 경고 발생).
      if (!loadingRef.current) {
        api.hideOverlay()
        api.showNoRowsOverlay()
      }
    } else {
      api.setGridOption('rowData', rowsRef.current)
    }
  }, [])

  const handleGridReady = useCallback((event: GridReadyEvent<TData>) => {
    gridApiRef.current = event.api
    // FlexLayout처럼 컨테이너 픽셀 크기를 마운트 커밋 이후(레이아웃 엔진의 후속 effect)에
    // 확정하는 경우, 그리드 초기화 시점에 측정한 크기가 최종 크기가 아닐 수 있다.
    // 한 프레임 뒤 다시 한번 강제로 재계산시켜 최종 크기를 반영하게 한다.
    requestAnimationFrame(() => forceRelayout(event.api))
  }, [forceRelayout])

  // FlexLayout처럼 마운트 이후 컨테이너 픽셀 크기를 늦게 확정하는 레이아웃 엔진에서는
  // AG Grid가 레이아웃되지 않은(0크기/분리된) 컨테이너에서 테마 CSS 변수(헤더/행 높이 등)를
  // 실측해 깨진 값이 캐시되는 경우가 있다 — 헤더가 1px로 붕괴하고, 빈 그리드는 이후 재측정
  // 계기가 없어 그 상태로 고착된다(데이터가 있으면 갱신이 재측정을 유발해 우연히 복구).
  // 같은 자리에 그리드를 리마운트해도 같은 조건에서 재측정되어 다시 깨지므로(리마운트 루프),
  // 탭을 숨겼다 다시 보이면 복구되는 실사용 경로와 동일하게 "컨테이너를 한 프레임 숨겼다 복원"해
  // AG Grid 내부 측정 ResizeObserver가 올바른 값으로 재측정하게 유도한다. 연속 시도는 3회로 제한.
  const repairAttemptsRef = useRef(0)
  const repairMeasurement = useCallback(() => {
    const el = containerRef.current
    if (!el || repairAttemptsRef.current >= 3) return
    repairAttemptsRef.current += 1
    const prev = el.style.display
    el.style.display = 'none'
    requestAnimationFrame(() => { el.style.display = prev })
  }, [])

  const checkMeasurement = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    // 숨김/최소화 상태(0크기)에서는 판단하지 않는다
    if (rect.width < 50 || rect.height < 50) return
    const header = el.querySelector('.ag-header')
    if (!header) return
    if (header.getBoundingClientRect().height < 2) repairMeasurement()
    else repairAttemptsRef.current = 0
  }, [repairMeasurement])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      checkMeasurement()
      const rect = el.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) return
      if (gridApiRef.current) forceRelayout(gridApiRef.current)
    })
    observer.observe(el)
    // 붕괴 이후 크기 변화가 더 없으면 RO가 다시 울리지 않으므로 마운트 직후 몇 차례 지연 점검
    const timers = [500, 1500, 3000].map(ms => setTimeout(checkMeasurement, ms))
    return () => {
      observer.disconnect()
      timers.forEach(clearTimeout)
    }
  }, [checkMeasurement, forceRelayout])

  const handleGetRowId = useCallback(
    (params: { data: TData }) => getRowId!(params.data),
    [getRowId]
  )

  const handleRowClicked = useCallback(
    (event: RowClickedEvent<TData>) => {
      if (onRowClick && event.data) onRowClick(event.data)
    },
    [onRowClick]
  )

  // 실제로 마지막 행까지 스크롤됐을 때만 추가 조회 (초기 렌더 시 발화 방지)
  const handleBodyScrollEnd = useCallback(
    (event: BodyScrollEndEvent<TData>) => {
      if (!onScrollEnd) return
      const total = event.api.getDisplayedRowCount()
      if (total === 0) return
      if (event.api.getLastDisplayedRowIndex() >= total - 1) onScrollEnd()
    },
    [onScrollEnd]
  )

  return (
    <Box ref={containerRef} sx={{ height, width: '100%', padding:'0', borderTop: '1px solid #eee', borderRadius: '8px', background: 'hsl(var(--background) / .8)' }}>
      <AgGridReact<TData>
        theme={gridTheme}
        rowData={rows}
        columnDefs={columnDefs}
        getRowId={getRowId ? handleGetRowId : undefined}
        loading={loading}
        onGridReady={handleGridReady}
        onRowClicked={onRowClick ? handleRowClicked : undefined}
        onBodyScrollEnd={onScrollEnd ? handleBodyScrollEnd : undefined}
        suppressScrollOnNewData={!!onScrollEnd}
        headerHeight={headerHeight}
        rowHeight={rowHeight}
        pagination={pagination}
        paginationPageSize={pageSize}
        paginationPageSizeSelector={pagination ? Array.from(new Set([pageSize, 20, 50, 100])).sort((a, b) => a - b) : false}
        rowSelection={selectable ? { mode: 'singleRow' } : undefined}
        selectionColumnDef={selectable ? { headerName: selectionHeaderName, width: selectionColumnWidth, sortable: false, resizable: false } : undefined}
        localeText={{ noRowsToShow: '조회된 데이터가 없습니다.' }}
        defaultColDef={{ resizable: true, sortable: true, filter: false }}
      />
    </Box>
  )
}
