'use client'

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'

import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Radio } from '@/components/ui/Radio'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { DatePicker } from '@/components/ui/DatePicker'
import { Table } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/global/Modal'
import { ConfirmDialog } from '@/components/global/ConfirmDialog'
import { AlertDialog } from '@/components/global/AlertDialog'
import { LoadingSpinner } from '@/components/global/LoadingSpinner'
import { useToast } from '@/components/global/Toast'
import { Chart } from '@/components/ui/Chart'
import { DataGrid } from '@/components/ui/DataGrid'
import type { ColDef } from 'ag-grid-community'

interface StockRow {
  name: string
  code: string
  price: number
  change: number
  status: 'active' | 'inactive' | 'pending'
}

const stockRows: StockRow[] = [
  { name: '삼성전자', code: '005930', price: 72300, change: 1.2, status: 'active' },
  { name: 'SK하이닉스', code: '000660', price: 198500, change: -0.8, status: 'active' },
  { name: 'NAVER', code: '035420', price: 215000, change: 0.5, status: 'pending' },
  { name: 'Kakao', code: '035720', price: 48500, change: -2.1, status: 'inactive' },
]

const stockColumns = [
  { key: 'name' as const, label: '종목명' },
  { key: 'code' as const, label: '코드', align: 'center' as const },
  {
    key: 'price' as const,
    label: '현재가',
    align: 'right' as const,
    render: (v: unknown) => `₩${(v as number).toLocaleString()}`,
  },
  {
    key: 'change' as const,
    label: '등락률',
    align: 'right' as const,
    render: (v: unknown) => {
      const val = v as number
      return (
        <span style={{ color: val >= 0 ? '#26a69a' : '#ef5350' }}>
          {val >= 0 ? '+' : ''}{val}%
        </span>
      )
    },
  },
  {
    key: 'status' as const,
    label: '상태',
    render: (v: unknown) => (
      <StatusBadge status={v as 'active' | 'inactive' | 'pending'} />
    ),
  },
]

const ohlcData = [
  { time: '2024-01-02', open: 71500, high: 73200, low: 71100, close: 72300 },
  { time: '2024-01-03', open: 72300, high: 74100, low: 72000, close: 73800 },
  { time: '2024-01-04', open: 73800, high: 74500, low: 72500, close: 72900 },
  { time: '2024-01-05', open: 72900, high: 73600, low: 71800, close: 71500 },
  { time: '2024-01-08', open: 71500, high: 72800, low: 70900, close: 72100 },
  { time: '2024-01-09', open: 72100, high: 73900, low: 71900, close: 73500 },
  { time: '2024-01-10', open: 73500, high: 75200, low: 73200, close: 74800 },
  { time: '2024-01-11', open: 74800, high: 75600, low: 74200, close: 74500 },
  { time: '2024-01-12', open: 74500, high: 76100, low: 74300, close: 75900 },
  { time: '2024-01-15', open: 75900, high: 76800, low: 75100, close: 75400 },
  { time: '2024-01-16', open: 75400, high: 76200, low: 74800, close: 76000 },
  { time: '2024-01-17', open: 76000, high: 77500, low: 75700, close: 77200 },
  { time: '2024-01-18', open: 77200, high: 77900, low: 76100, close: 76500 },
  { time: '2024-01-19', open: 76500, high: 77000, low: 75500, close: 75800 },
  { time: '2024-01-22', open: 75800, high: 76300, low: 74900, close: 75200 },
]

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

export default function ComponentsUiPage() {
  const toast = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)

  const [checked, setChecked] = useState(false)
  const [radioValue, setRadioValue] = useState('a')
  const [segment, setSegment] = useState('1d')
  const [toggleOn, setToggleOn] = useState(false)
  const [selectValue, setSelectValue] = useState<string>('')
  const [tabValue, setTabValue] = useState('overview')
  const [dateValue, setDateValue] = useState<Date | null>(null)
  const [page, setPage] = useState(1)

  return (
    <Box sx={{ p: 4, maxWidth: 'full', mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
        컴포넌트 갤러리
      </Typography>

      <Section title="버튼" description="Button 컴포넌트 - variant / loading / disabled">
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
          <Button variant="contained">Contained</Button>
          <Button variant="outlined">Outlined</Button>
          <Button variant="text">Text</Button>
          <Button variant="contained" loading>Loading</Button>
          <Button variant="contained" disabled>Disabled</Button>
          <Button variant="contained" color="error">Error</Button>
          <Button variant="contained" color="success">Success</Button>
        </Stack>
      </Section>

      <Divider sx={{ my: 4 }} />

      <Section title="입력 필드" description="Input 컴포넌트">
        <Stack spacing={2} sx={{ maxWidth: 400 }}>
          <Input label="이름" placeholder="이름을 입력하세요" />
          <Input label="이메일" error helperText="올바른 이메일을 입력하세요" defaultValue="invalid" />
          <Input label="비밀번호" type="password" />
          <Input label="비활성" disabled defaultValue="수정 불가" />
        </Stack>
      </Section>

      <Divider sx={{ my: 4 }} />

      <Section title="체크박스">
        <Stack spacing={1}>
          <Checkbox label="기본" checked={checked} onChange={setChecked} />
          <Checkbox label="선택됨" checked={true} onChange={() => {}} />
          <Checkbox label="부분 선택" checked={false} indeterminate onChange={() => {}} />
          <Checkbox label="비활성" checked={false} onChange={() => {}} disabled />
        </Stack>
      </Section>

      <Divider sx={{ my: 4 }} />

      <Section title="라디오">
        <Stack spacing={2}>
          <Radio
            label="세로 배치"
            value={radioValue}
            onChange={setRadioValue}
            options={[
              { label: '옵션 A', value: 'a' },
              { label: '옵션 B', value: 'b' },
              { label: '옵션 C (비활성)', value: 'c', disabled: true },
            ]}
          />
          <Radio
            label="수평 배치"
            value={radioValue}
            onChange={setRadioValue}
            row
            options={[
              { label: '매수', value: 'buy' },
              { label: '매도', value: 'sell' },
            ]}
          />
        </Stack>
      </Section>

      <Divider sx={{ my: 4 }} />

      <Section title="세그먼트 컨트롤">
        <Stack spacing={2}>
          <SegmentedControl
            value={segment}
            onChange={setSegment}
            options={[
              { label: '1일', value: '1d' },
              { label: '1주', value: '1w' },
              { label: '1개월', value: '1m' },
              { label: '1년', value: '1y' },
            ]}
          />
          <SegmentedControl
            value={segment}
            onChange={setSegment}
            fullWidth
            options={[
              { label: '1일', value: '1d' },
              { label: '1주', value: '1w' },
              { label: '1개월', value: '1m' },
              { label: '1년', value: '1y' },
            ]}
          />
        </Stack>
      </Section>

      <Divider sx={{ my: 4 }} />

      <Section title="토글 스위치">
        <Stack spacing={1}>
          <ToggleSwitch checked={toggleOn} onChange={setToggleOn} />
          <ToggleSwitch label="알림 활성화" checked={toggleOn} onChange={setToggleOn} />
          <ToggleSwitch label="비활성" checked={false} onChange={() => {}} disabled />
        </Stack>
      </Section>

      <Divider sx={{ my: 4 }} />

      <Section title="셀렉트">
        <Stack spacing={2} sx={{ maxWidth: 300 }}>
          <Select
            label="종목 선택"
            value={selectValue}
            onChange={setSelectValue}
            fullWidth
            options={[
              { label: '삼성전자', value: '005930' },
              { label: 'SK하이닉스', value: '000660' },
              { label: 'NAVER', value: '035420' },
            ]}
            placeholder="종목을 선택하세요"
          />
          <Select
            label="오류 상태"
            value=""
            onChange={() => {}}
            fullWidth
            error
            helperText="종목을 선택해주세요"
            options={[{ label: '삼성전자', value: '005930' }]}
          />
        </Stack>
      </Section>

      <Divider sx={{ my: 4 }} />

      <Section title="상태 배지">
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {(['active', 'inactive', 'pending', 'error', 'success', 'warning'] as const).map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </Stack>
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
            {(['active', 'inactive', 'pending', 'error', 'success', 'warning'] as const).map((s) => (
              <StatusBadge key={s} status={s} dot />
            ))}
          </Stack>
        </Stack>
      </Section>

      <Divider sx={{ my: 4 }} />

      <Section title="카드">
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
          <Card title="삼성전자" subtitle="005930" sx={{ minWidth: 200 }}>
            <Typography variant="h6">₩72,300</Typography>
            <Typography variant="body2" color="success.main">+1.2%</Typography>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <Typography>제목 없는 카드</Typography>
          </Card>
        </Stack>
      </Section>

      <Divider sx={{ my: 4 }} />

      <Section title="탭">
        <Tabs
          value={tabValue}
          onChange={(v) => setTabValue(String(v))}
          tabs={[
            { value: 'overview', label: '개요' },
            { value: 'holdings', label: '보유종목' },
            { value: 'history', label: '거래내역' },
            { value: 'disabled', label: '비활성', disabled: true },
          ]}
        />
      </Section>

      <Divider sx={{ my: 4 }} />

      <Section title="날짜 피커">
        <Stack spacing={2} sx={{ maxWidth: 300 }}>
          <DatePicker label="시작일" value={dateValue} onChange={setDateValue} />
          <DatePicker label="오류 상태" value={null} onChange={() => {}} error helperText="날짜를 선택해주세요" />
        </Stack>
      </Section>

      <Divider sx={{ my: 4 }} />

      <Section title="테이블">
        <Stack spacing={3}>
          <Table rows={stockRows} columns={stockColumns} />
          <Table rows={[]} columns={stockColumns} emptyMessage="보유 종목이 없습니다." />
          <Table rows={[]} columns={stockColumns} loading />
        </Stack>
      </Section>

      <Divider sx={{ my: 4 }} />

      <Section title="페이지네이션">
        <Pagination page={page} totalPages={10} onChange={setPage} showFirstButton showLastButton />
      </Section>

      <Divider sx={{ my: 4 }} />

      <Section title="차트" description="Chart 컴포넌트 - candlestick / line / area">
        <Stack spacing={3}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>캔들스틱</Typography>
            <Chart data={ohlcData} height={300} type="candlestick" />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>라인</Typography>
            <Chart data={ohlcData} height={200} type="line" />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>에어리어</Typography>
            <Chart data={ohlcData} height={200} type="area" />
          </Box>
        </Stack>
      </Section>

      <Divider sx={{ my: 4 }} />

      <Section title="데이터그리드" description="DataGrid 컴포넌트 - ag-grid 기반">
        <Stack spacing={3}>
          <DataGrid rows={gridRows} columnDefs={gridColumns} height={300} />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>페이지네이션</Typography>
            <DataGrid rows={gridRows} columnDefs={gridColumns} height={300} pagination pageSize={3} />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>로딩 상태</Typography>
            <DataGrid rows={[]} columnDefs={gridColumns} height={200} loading />
          </Box>
        </Stack>
      </Section>

      <Divider sx={{ my: 4 }} />

      <Section title="로딩 스피너">
        <Stack direction="row" spacing={4} sx={{ alignItems: 'center' }}>
          <LoadingSpinner size={24} />
          <LoadingSpinner size={40} />
          <LoadingSpinner size={56} message="불러오는 중..." />
        </Stack>
      </Section>

      <Divider sx={{ my: 4 }} />

      <Section title="다이얼로그 & 토스트">
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={() => setModalOpen(true)}>Modal 열기</Button>
          <Button variant="outlined" onClick={() => setConfirmOpen(true)}>ConfirmDialog 열기</Button>
          <Button variant="outlined" onClick={() => setAlertOpen(true)}>AlertDialog 열기</Button>
          <Button variant="contained" color="success" onClick={() => toast.success('저장되었습니다.')}>Toast Success</Button>
          <Button variant="contained" color="error" onClick={() => toast.error('오류가 발생했습니다.')}>Toast Error</Button>
          <Button variant="contained" color="warning" onClick={() => toast.warning('주의가 필요합니다.')}>Toast Warning</Button>
          <Button variant="contained" color="info" onClick={() => toast.info('정보를 확인하세요.')}>Toast Info</Button>
        </Stack>
      </Section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="모달 예시"
        actions={
          <>
            <Button variant="outlined" onClick={() => setModalOpen(false)}>닫기</Button>
            <Button variant="contained" onClick={() => setModalOpen(false)}>확인</Button>
          </>
        }
      >
        <Typography>모달 내용입니다. 여기에 원하는 컨텐츠를 넣을 수 있습니다.</Typography>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); toast.success('삭제되었습니다.') }}
        title="삭제 확인"
        message="이 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        severity="error"
        confirmLabel="삭제"
      />

      <AlertDialog
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        title="알림"
        message="작업이 완료되었습니다."
      />
    </Box>
  )
}
