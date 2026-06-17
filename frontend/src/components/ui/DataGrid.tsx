'use client'

import React, { useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef, RowClickedEvent, BodyScrollEndEvent } from 'ag-grid-community'
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
  headerHeight = 36,
  rowHeight = 32,
}: DataGridProps<TData>) {
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
    <Box sx={{ height, width: '100%', padding:'6px', border: '1px solid #eee', borderRadius: '8px', background: 'hsl(var(--background) / .8)' }}>
      <AgGridReact<TData>
        theme={gridTheme}
        rowData={rows}
        columnDefs={columnDefs}
        loading={loading}
        onRowClicked={onRowClick ? handleRowClicked : undefined}
        onBodyScrollEnd={onScrollEnd ? handleBodyScrollEnd : undefined}
        suppressScrollOnNewData={!!onScrollEnd}
        headerHeight={headerHeight}
        rowHeight={rowHeight}
        pagination={pagination}
        paginationPageSize={pageSize}
        paginationPageSizeSelector={pagination ? Array.from(new Set([pageSize, 20, 50, 100])).sort((a, b) => a - b) : false}
        rowSelection={onRowClick ? { mode: 'singleRow' } : undefined}
        defaultColDef={{ resizable: true, sortable: true, filter: true }}
      />
    </Box>
  )
}
