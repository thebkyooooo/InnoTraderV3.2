'use client'
import React, { useState } from 'react'
import type { ColDef } from 'ag-grid-community'
import { Section } from '@/components/ui/Section'
import { Chart } from '@/components/ui/Chart'
import { DataGrid } from '@/components/ui/DataGrid'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'

// 차트 샘플 데이터
const ohlcData = [
  { time: '2024-01-02', open: 71500, high: 73200, low: 71100, close: 72300, volume: 9823456 },
  { time: '2024-01-03', open: 72300, high: 74100, low: 72000, close: 73800, volume: 12456789 },
  { time: '2024-01-04', open: 73800, high: 74500, low: 72500, close: 72900, volume: 8234567 },
  { time: '2024-01-05', open: 72900, high: 73600, low: 71800, close: 71500, volume: 15678901 },
  { time: '2024-01-08', open: 71500, high: 72800, low: 70900, close: 72100, volume: 7345678 },
  { time: '2024-01-09', open: 72100, high: 73900, low: 71900, close: 73500, volume: 11234567 },
  { time: '2024-01-10', open: 73500, high: 75200, low: 73200, close: 74800, volume: 18901234 },
  { time: '2024-01-11', open: 74800, high: 75600, low: 74200, close: 74500, volume: 6789012 },
  { time: '2024-01-12', open: 74500, high: 76100, low: 74300, close: 75900, volume: 13456789 },
  { time: '2024-01-15', open: 75900, high: 76800, low: 75100, close: 75400, volume: 9012345 },
  { time: '2024-01-16', open: 75400, high: 76200, low: 74800, close: 76000, volume: 10345678 },
  { time: '2024-01-17', open: 76000, high: 77500, low: 75700, close: 77200, volume: 21234567 },
  { time: '2024-01-18', open: 77200, high: 77900, low: 76100, close: 76500, volume: 14567890 },
  { time: '2024-01-19', open: 76500, high: 77000, low: 75500, close: 75800, volume: 8901234 },
  { time: '2024-01-22', open: 75800, high: 76300, low: 74900, close: 75200, volume: 7234567 },
]


// 그리드 샘플
interface DailyGridStockRow {
  date: string
  price: number
  change: number
  volume: number
  marketCap: string
}

const gridRows: DailyGridStockRow[] = [
  { date: '2026-06-15', price: 72300, change: 1.2, volume: 12456789, marketCap: '431조' },
  { date: '2026-06-14', price: 198500, change: -0.8, volume: 3214567, marketCap: '144조' },
  { date: '2026-06-13', price: 215000, change: 0.5, volume: 987654, marketCap: '35조' },
  { date: '2026-06-12', price: 48500, change: -2.1, volume: 4567890, marketCap: '21조' },
  { date: '2026-06-11', price: 385000, change: 3.2, volume: 567890, marketCap: '90조' }
]

const gridColumns: ColDef<DailyGridStockRow>[] = [
  { field: 'date', headerName: '일자', flex: 1, minWidth: 120 },
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
// 그리드 샘플 마지막

// 체결 그리드 샘플
interface TimeGridStockRow {
  time: string
  price: number
  change: number
  volume: number
  marketCap: string
}

const timeGridRows: TimeGridStockRow[] = [
  { time: '09:10:30', price: 72300, change: 1.2, volume: 12456789, marketCap: '431조' },
  { time: '09:09:30', price: 198500, change: -0.8, volume: 3214567, marketCap: '144조' },
  { time: '09:08:30', price: 215000, change: 0.5, volume: 987654, marketCap: '35조' },
  { time: '09:07:30', price: 48500, change: -2.1, volume: 4567890, marketCap: '21조' },
  { time: '09:06:30', price: 385000, change: 3.2, volume: 567890, marketCap: '90조' }
]

const timeGgridColumns: ColDef<TimeGridStockRow>[] = [
  { field: 'time', headerName: '시간', flex: 1, minWidth: 120 },
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
// 그리드 샘플 마지막

// 투자동향 그리드 샘플
interface TrendGridStockRow {
  date: string
  price: number
  change: number
  volume: number
  marketCap: string
}

const trendGridRows: TrendGridStockRow[] = [
  { date: '2026-06-15', price: 72300, change: 1.2, volume: 12456789, marketCap: '431조' },
  { date: '2026-06-15', price: 198500, change: -0.8, volume: 3214567, marketCap: '144조' },
  { date: '2026-06-15', price: 215000, change: 0.5, volume: 987654, marketCap: '35조' },
  { date: '2026-06-15', price: 48500, change: -2.1, volume: 4567890, marketCap: '21조' },
  { date: '2026-06-15', price: 385000, change: 3.2, volume: 567890, marketCap: '90조' }
]

const trendGgridColumns: ColDef<TrendGridStockRow>[] = [
  { field: 'date', headerName: '일자', flex: 1, minWidth: 120 },
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
// 그리드 샘플 마지막


export default function SampleMarketPricePage() {

  return (
    <>
      <div className="flex flex-col gap-4 w-full h-full p-4">

        <h1 className="text-lg font-bold text-foreground">현재가 샘플 페이지</h1>

        {/* 현재가 (Quote Board) 컴포넌트 샘플 */}
        <Section>
          <div className="flex gap-1 py-1 items-start">
            <span className='font-semibold'>삼성전자</span>
            <span className='text-xs py-0.5'>005930</span>
            <span className='text-xs py-0.5'>KOSPI</span>
            <SearchOutlinedIcon className='ml-auto'/>
          </div>
          <div className="flex gapx-2 py-1 items-end">
            <span className='text-2xl font-semibold'>190,000원</span>
            <span className='text-sm  py-0.5 text-blue-500'>▲11,606 -5.75%</span>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(132px,1fr))] gap-2 mt-4">
            <div className="flex justify-between border border-gray-100 rounded text-xs px-2 py-1 bg-slate-100">
              <span className="text-left">거래량</span>
              <span className="text-right">12,245,799</span>
            </div>
            <div className="flex justify-between border border-gray-100 rounded text-xs px-2 py-1 bg-slate-100">
              <span className="text-left">시가</span>
              <span className="text-right">202,006</span>
            </div>
            <div className="flex justify-between border border-gray-100 rounded text-xs px-2 py-1 bg-slate-100">
              <span className="text-left">고가</span>
              <span className="text-right">213,500</span>
            </div>
            <div className="flex justify-between border border-gray-100 rounded text-xs px-2 py-1 bg-slate-100">
              <span className="text-left">저가</span>
              <span className="text-right">178,100</span>
            </div>
            <div className="flex justify-between border border-gray-100 rounded text-xs px-2 py-1 bg-slate-100">
              <span className="text-left">전일</span>
              <span className="text-right">202,006</span>
            </div>
            <div className="flex justify-between border border-gray-100 rounded text-xs px-2 py-1 bg-slate-100">
              <span className="text-left">상한가</span>
              <span className="text-right">262,607</span>
            </div>
            <div className="flex justify-between border border-gray-100 rounded text-xs px-2 py-1 bg-slate-100">
              <span className="text-left">하한가</span>
              <span className="text-right">141,404</span>
            </div>
            <div className="flex justify-between border border-gray-100 rounded text-xs px-2 py-1 bg-slate-100">
              <span className="text-left">거래대금</span>
              <span className="text-right">2.4조</span>
            </div>
          </div>
        </Section>

        <div className="flex flex-col-reverse sm:flex-row gap-4">
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <Section>
              <Chart data={ohlcData} height={360} type="candlestick" />
            </Section>
            <Section>
              <div className='h-[360px]'>호가</div>
            </Section>
            <DataGrid rows={gridRows} columnDefs={gridColumns} height={'230px'} />
            <DataGrid rows={timeGridRows} columnDefs={timeGgridColumns} height={'230px'} />
            <DataGrid rows={trendGridRows} columnDefs={trendGgridColumns} height={'230px'} />
          </div>

          <div className="sm:w-[280px] flex flex-col gap-4">
            <Section>
              <div className='h-[360px]'>종목상세</div>
            </Section>
          </div>
        </div>
      </div>
    </>
  )
}
