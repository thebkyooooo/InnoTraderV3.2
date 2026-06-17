import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Table } from './Table'
import { StatusBadge } from './StatusBadge'

const meta = {
  title: 'UI/Table',
  component: Table,
  tags: ['autodocs'],
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

interface StockRow {
  name: string
  code: string
  price: number
  change: number
  status: 'active' | 'inactive' | 'pending'
}

const columns = [
  { key: 'name' as const, label: '종목명', width: 160 },
  { key: 'code' as const, label: '종목코드', align: 'center' as const },
  { key: 'price' as const, label: '현재가', align: 'right' as const, render: (v: unknown) => `₩${(v as number).toLocaleString()}` },
  {
    key: 'change' as const,
    label: '등락률',
    align: 'right' as const,
    render: (v: unknown) => {
      const val = v as number
      return <span style={{ color: val >= 0 ? '#26a69a' : '#ef5350' }}>{val >= 0 ? '+' : ''}{val}%</span>
    },
  },
  {
    key: 'status' as const,
    label: '상태',
    render: (v: unknown) => <StatusBadge status={v as 'active' | 'inactive' | 'pending'} />,
  },
]

const rows: StockRow[] = [
  { name: '삼성전자', code: '005930', price: 72300, change: 1.2, status: 'active' },
  { name: 'SK하이닉스', code: '000660', price: 198500, change: -0.8, status: 'active' },
  { name: 'NAVER', code: '035420', price: 215000, change: 0.5, status: 'pending' },
  { name: 'Kakao', code: '035720', price: 48500, change: -2.1, status: 'inactive' },
]

export const Default: Story = {
  args: { rows, columns },
}

export const Loading: Story = {
  args: { rows: [], columns, loading: true },
}

export const Empty: Story = {
  args: { rows: [], columns, emptyMessage: '보유 종목이 없습니다.' },
}

export const StickyHeader: Story = {
  args: { rows, columns, stickyHeader: true, maxHeight: 200 },
}
