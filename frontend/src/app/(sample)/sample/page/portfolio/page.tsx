'use client'
import React, { useState } from 'react'
import type { ColDef } from 'ag-grid-community'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { DataGrid } from '@/components/ui/DataGrid'

// 그리드 샘플
interface GridStockRow {
  name: string
  code: string
  price: number
  change: number
  volume: number
  marketCap: string
}

const gridRows: GridStockRow[] = [
  { name: '삼성전자', code: '005930', price: 72300, change: 1.2, volume: 12456789, marketCap: '431조' },
  { name: 'SK하이닉스', code: '000660', price: 198500, change: -0.8, volume: 3214567, marketCap: '144조' },
  { name: 'NAVER', code: '035420', price: 215000, change: 0.5, volume: 987654, marketCap: '35조' },
  { name: 'Kakao', code: '035720', price: 48500, change: -2.1, volume: 4567890, marketCap: '21조' },
  { name: 'LG에너지솔루션', code: '373220', price: 385000, change: 3.2, volume: 567890, marketCap: '90조' },
  { name: '현대자동차', code: '005380', price: 245000, change: 0.8, volume: 1234567, marketCap: '52조' },
]

const gridColumns: ColDef<GridStockRow>[] = [
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

export default function SamplePortfolioPage() {

  const [selectValue, setSelectValue] = useState<string>('001')

  return (
    <>
      <div className="flex flex-col gap-4 w-full h-full p-4">

        <h1 className="text-lg font-bold text-foreground">포트폴리오(보유주식) 샘플 페이지</h1>

        {/* 계좌 셀렉트 */}
        <Select
          fullWidth
          label="계좌번호 선택"
          value={selectValue}
          onChange={setSelectValue}
          options={[
            {
              label: '123-01-123456 주식계좌',
              value: '001'
            },
            {
              label: '123-02-123456 주식계좌',
              value: '002'
            },
            {
              label: '123-03-123456 주식계좌',
              value: '003'
            }
          ]}
          size="small"
          placeholder='계좌번호를 선택하세요'
        />

        {/* 보유주식 요약 */}
        <div className='flex gap-2 '>
          <Card  sx={{ width: '100%' }}>
            <div className='flex flex-col gap-2 justify-between -mb-3'>
              <span className='text-sm'>총자산</span>
              <span className='text-right'>100,000,000</span>
            </div>
          </Card>
          <Card  sx={{ width: '100%' }}>
            <div className='flex flex-col gap-2 justify-between -mb-3'>
              <span className='text-sm'>총평가</span>
              <span className='text-right'>100,000,000</span>
            </div>
          </Card>
          <Card  sx={{ width: '100%' }}>
            <div className='flex flex-col gap-2 justify-between -mb-3'>
              <span className='text-sm'>총수익</span>
              <span className='text-right'>100,000,000</span>
            </div>
          </Card>
          <Card  sx={{ width: '100%' }}>
            <div className='flex flex-col gap-2 justify-between -mb-3'>
              <span className='text-sm'>수익률</span>
              <span className='text-right'>35.15%</span>
            </div>
          </Card>
        </div>

        {/* 보유주식 그리드 */}
        <DataGrid rows={gridRows} columnDefs={gridColumns} height={'100%'} />
      </div>
    </>
  )
}
