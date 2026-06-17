import type { Meta } from '@storybook/react'
import React from 'react'
import type { ColDef } from 'ag-grid-community'
import { DataGrid } from './DataGrid'

const meta: Meta = {
  title: 'UI/DataGrid',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta

interface StockRow {
  name: string
  code: string
  price: number
  change: number
  volume: number
  marketCap: string
}

const columnDefs: ColDef<StockRow>[] = [
  { field: 'name', headerName: '종목명', flex: 1, minWidth: 120 },
  { field: 'code', headerName: '코드', width: 100, cellStyle: { textAlign: 'center' } },
  {
    field: 'price',
    headerName: '현재가',
    width: 120,
    cellStyle: { textAlign: 'right' },
    valueFormatter: (p) => `₩${p.value.toLocaleString()}`,
  },
  {
    field: 'change',
    headerName: '등락률',
    width: 100,
    cellStyle: (p) => ({
      textAlign: 'right',
      color: p.value >= 0 ? '#26a69a' : '#ef5350',
      fontWeight: 600,
    }),
    valueFormatter: (p) => `${p.value >= 0 ? '+' : ''}${p.value}%`,
  },
  {
    field: 'volume',
    headerName: '거래량',
    flex: 1,
    minWidth: 120,
    cellStyle: { textAlign: 'right' },
    valueFormatter: (p) => p.value.toLocaleString(),
  },
  { field: 'marketCap', headerName: '시가총액', width: 100, cellStyle: { textAlign: 'right' } },
]

const rows: StockRow[] = [
  { name: '삼성전자', code: '005930', price: 72300, change: 1.2, volume: 12456789, marketCap: '431조' },
  { name: 'SK하이닉스', code: '000660', price: 198500, change: -0.8, volume: 3214567, marketCap: '144조' },
  { name: 'NAVER', code: '035420', price: 215000, change: 0.5, volume: 987654, marketCap: '35조' },
  { name: 'Kakao', code: '035720', price: 48500, change: -2.1, volume: 4567890, marketCap: '21조' },
  { name: 'LG에너지솔루션', code: '373220', price: 385000, change: 3.2, volume: 567890, marketCap: '90조' },
  { name: '현대자동차', code: '005380', price: 245000, change: 0.8, volume: 1234567, marketCap: '52조' },
]

export const Default = {
  render: () => <DataGrid rows={rows} columnDefs={columnDefs} height={300} />,
}

export const WithPagination = {
  name: '페이지네이션',
  render: () => <DataGrid rows={rows} columnDefs={columnDefs} height={320} pagination pageSize={3} />,
}

export const Loading = {
  name: '로딩',
  render: () => <DataGrid rows={[]} columnDefs={columnDefs} height={200} loading />,
}

export const Empty = {
  name: '빈 데이터',
  render: () => <DataGrid rows={[]} columnDefs={columnDefs} height={200} />,
}
