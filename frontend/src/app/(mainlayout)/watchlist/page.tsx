'use client'
import React, { useEffect, useMemo, useState } from 'react'
import type { ColDef } from 'ag-grid-community'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { CreateNewFolderOutlined, DriveFileRenameOutline, AddCircleOutlined, RemoveCircleOutlined, DeleteOutlined, TaskAlt } from '@mui/icons-material'
import Button from '@mui/material/Button'
import { Modal } from '@/components/ui/Modal'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { Select } from '@/components/ui/Select'
import { DataGrid } from '@/components/ui/DataGrid'
import { Section } from '@/components/ui/Section'
import { type WatchlistGroup } from '@/features/watchlist/api/watchlist-api'
import {
  useWatchlistGroups,
  useWatchlistItems,
  useCreateWatchlistGroup,
  useRenameWatchlistGroup,
  useDeleteWatchlistGroup,
  useAddWatchlistItems,
  useRemoveWatchlistItems,
} from '@/features/watchlist/api/use-watchlist'
import { type StockQuote } from '@/features/stock-master/api/stock-master-api'
import { useStockQuotes } from '@/features/stock-master/api/use-stock-master'
import { useStockPricesWS } from '@/features/quote/api/use-quote-ws'
import { StockDetailCard, DailyChart } from '@/components/quote'
import { GroupFormDialog } from '@/features/watchlist/components/GroupFormDialog'
import { StockAddDialog } from '@/features/watchlist/components/StockAddDialog'
import { StockRemoveDialog } from '@/features/watchlist/components/StockRemoveDialog'
import { ArrowForwardIosSharp, FormatIndentIncreaseOutlined } from '@mui/icons-material';

// ── 그리드 ──────────────────────────────────────────────────────────────────────

const UP = '#ef5350', DOWN = '#4285f4'
const fmt = (n: number) => (n ?? 0).toLocaleString('ko-KR')
const signColor = (v: number) => (v > 0 ? UP : v < 0 ? DOWN : '#6b7280')
const right = { textAlign: 'right' as const }
const center = { textAlign: 'center' as const }

const columns: ColDef<StockQuote>[] = [
  { field: 'name',        headerName: '종목명',     flex: 1, minWidth: 160 },
  { field: 'symbol',      headerName: '종목코드',   width: 90, cellStyle: center, headerClass: 'header-center' },
  { field: 'price',       headerName: '종가',       width: 120, cellStyle: right, headerClass: 'header-right', valueFormatter: p => fmt(p.value) },
  { field: 'prevDiff',    headerName: '전일대비',   width: 100, cellStyle: p => ({ ...right, color: signColor(p.value), fontWeight: 600 }), headerClass: 'header-right', valueFormatter: p => `${p.value > 0 ? '+' : ''}${fmt(p.value)}` },
  { field: 'change',      headerName: '등락률',     width: 90,  cellStyle: p => ({ ...right, color: signColor(p.value), fontWeight: 600 }), headerClass: 'header-right', valueFormatter: p => `${p.value > 0 ? '+' : ''}${Number(p.value).toFixed(2)}%` },
  { field: 'open', headerName: '시가', width: 100,
    cellStyle: p => { const pc = p.data ? p.data.price - p.data.prevDiff : 0; const c = p.value > pc ? UP : p.value < pc ? DOWN : null; return c ? { ...right, color: c } : right },
    valueFormatter: p => fmt(p.value), headerClass: 'header-right' },
  { field: 'high', headerName: '고가', width: 120, cellStyle: () => ({ ...right, color: UP }),   valueFormatter: p => fmt(p.value), headerClass: 'header-right' },
  { field: 'low',  headerName: '저가', width: 120, cellStyle: () => ({ ...right, color: DOWN }), valueFormatter: p => fmt(p.value), headerClass: 'header-right' },
  { field: 'volume',      headerName: '거래량',     width: 130, cellStyle: right, valueFormatter: p => fmt(p.value), headerClass: 'header-right' },
  { field: 'turnoverMan', headerName: '거래금액(만)', width: 130, cellStyle: right, valueFormatter: p => fmt(p.value), headerClass: 'header-right' },
  { field: 'market',      headerName: '시장구분',   width: 90,  cellStyle: center, headerClass: 'header-center' },
]

type ModalType = 'group-add' | 'group-rename' | 'group-delete' | 'stock-add' | 'stock-remove' | null

// ── 페이지 ──────────────────────────────────────────────────────────────────────

export default function WatchlistPage() {
  const [selectedCode, setSelectedCode] = useState('')
  const [modal, setModal]             = useState<ModalType>(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null)

  // ── 그룹 목록 ────────────────────────────────────────────────────────────────
  // AT는 메모리 저장이라 새로고침 시 사라진다 → enabled(accessToken) 가드로
  // 토큰이 준비된 뒤에만 조회한다.
  const { data: groups = [] } = useWatchlistGroups()

  const current = groups.find(g => g.groupCode === selectedCode)

  // 그룹 목록이 바뀌면 선택 그룹을 동기화한다(없으면 첫 그룹).
  useEffect(() => {
    setSelectedCode(prev => {
      if (groups.some(g => g.groupCode === prev)) return prev
      return groups[0]?.groupCode ?? ''
    })
  }, [groups])

  // ── 선택 그룹의 종목 + 시세 ──────────────────────────────────────────────────
  const { data: itemsData } = useWatchlistItems(selectedCode)
  const items = itemsData?.items ?? []
  const symbols = items.map(i => i.symbol)
  const { data: httpQuotes = [], isFetching: loading } = useStockQuotes(symbols)
  // 여러 종목 실시간 현재가 → HTTP 스냅샷에 머지(2초마다 가격/등락/거래량 갱신)
  const liveQuotes = useStockPricesWS(symbols)
  const quotes = useMemo(() => httpQuotes.map(q => {
    const live = liveQuotes[q.symbol]
    if (!live) return q
    return {
      ...q,
      price: live.price, prevDiff: live.prevDiff, change: live.change,
      open: live.open, high: live.high, low: live.low,
      volume: live.volume, turnoverMan: live.tradingAmount,
    }
  }), [httpQuotes, liveQuotes])

  // ── 선택 종목 동기화 ─────────────────────────────────────────────────────────
  // 그룹이 바뀌면 선택 종목을 첫 종목으로 맞춘다(없으면 해제)
  useEffect(() => {
    setSelectedStock(prev => {
      if (prev && quotes.some(q => q.symbol === prev.symbol)) return prev
      return quotes[0] ?? null
    })
  }, [quotes])

  // 사이드 패널 상단 현재가 실시간 반영 — quotes(WS 병합본)에서 같은 심볼을 매 렌더 조회
  const displayStock = useMemo(() => {
    if (!selectedStock) return null
    return quotes.find(q => q.symbol === selectedStock.symbol) ?? selectedStock
  }, [quotes, selectedStock])

  // ── 변경 핸들러 ──────────────────────────────────────────────────────────────
  const createGroup = useCreateWatchlistGroup()
  const renameGroup = useRenameWatchlistGroup()
  const deleteGroup = useDeleteWatchlistGroup()
  const addItems = useAddWatchlistItems()
  const removeItems = useRemoveWatchlistItems()

  const handleGroupSubmit = async (name: string) => {
    if (modal === 'group-add') {
      const list = (await createGroup.mutateAsync(name)).data
      // 가장 큰 코드 = 방금 생성된 그룹
      const newest = list.reduce<WatchlistGroup | undefined>((m, g) => (!m || g.groupCode > m.groupCode ? g : m), undefined)
      setSelectedCode(newest?.groupCode ?? selectedCode)
    } else if (modal === 'group-rename' && selectedCode) {
      await renameGroup.mutateAsync({ groupCode: selectedCode, groupName: name })
    }
    setModal(null)
  }

  const handleGroupDelete = async () => {
    if (selectedCode) {
      const list = (await deleteGroup.mutateAsync(selectedCode)).data
      setSelectedCode(list[0]?.groupCode ?? '')
    }
    setModal(null)
  }

  const handleStockAdd = async (symbols: string[]) => {
    if (selectedCode) {
      await addItems.mutateAsync({ groupCode: selectedCode, symbols })
    }
    setModal(null)
  }

  const handleStockRemove = async (symbols: string[]) => {
    if (selectedCode) {
      await removeItems.mutateAsync({ groupCode: selectedCode, symbols })
    }
    setModal(null)
  }

  // 모달 열기 전 트리거 버튼의 포커스 해제 (Dialog의 aria-hidden 배경에 포커스가 남는 경고 방지)
  const openModal = (m: ModalType) => {
    if (typeof document !== 'undefined') (document.activeElement as HTMLElement | null)?.blur()
    setModal(m)
  }

  // ── UI ──────────────────────────────────────────────────────────────────────
  return (
    <div aria-pressed={panelOpen} className="flex flex-col sm:flex-row gap-0 w-full h-full relative">
      <button
        type="button"
        onClick={() => setPanelOpen(v => !v)}
        aria-pressed={panelOpen}
        title={panelOpen ? '패널 숨기기' : '패널 보기'}
        className={`absolute hidden sm:block border border-gray-50 bg-slate-200 h-[40px] w-[24px] top-0.5 right-0.5 transition-transform duration-300 ease-in-out ${panelOpen ? 'rounded-l-2xl' : 'rounded-r-2xl rotate-180'}`}
      >
        <ArrowForwardIosSharp sx={{ fontSize: 20, color: 'text.disabled' }} />
      </button>

      <div 
          aria-hidden={!panelOpen}
          className={`@container p-4 sm:p-6 flex-1 flex flex-col gap-4 shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-in-out ${panelOpen ? 'w-full' : 'w-full'}`}
        >
        {/* <h1 className="text-lg font-bold text-foreground">관심종목</h1> */}

        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-[200px] pt-2">
            <Select
              fullWidth size="small" label="관심그룹 선택"
              value={selectedCode}
              onChange={setSelectedCode}
              options={groups.map(g => ({ label: `${g.groupName} (${g.itemCount})`, value: g.groupCode }))}
              placeholder="그룹을 선택하세요"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 items-center ml-auto">
            <div className='w-[24px] text-xs leading-[13px]'>그룹관리</div>
            <Tooltip title="그룹추가">
              <IconButton className='!p-0 !bg-slate-200' onClick={() => openModal('group-add')}><CreateNewFolderOutlined className='!text-[32px]' /></IconButton>
            </Tooltip>
            <Tooltip title="그룹변경">
              <span><IconButton className='!p-0 !bg-slate-200' onClick={() => openModal('group-rename')} disabled={!current}><DriveFileRenameOutline className='!text-[32px]' /></IconButton></span>
            </Tooltip>
            <Tooltip title="그룹삭제">
              <span><IconButton className='!p-0 !bg-slate-200' color="error" onClick={() => openModal('group-delete')} disabled={!current}><DeleteOutlined className='!text-[32px]' /></IconButton></span>
            </Tooltip>
            <div className='w-[24px] text-xs leading-[13px] ml-2'>종목관리</div>
            <Tooltip title="종목추가">
              <span><IconButton className='!p-0 !bg-slate-200' color="primary" onClick={() => openModal('stock-add')} disabled={!current}><AddCircleOutlined className='!text-[32px]' /></IconButton></span>
            </Tooltip>
            <Tooltip title="종목삭제">
              <span><IconButton className='!p-0 !bg-slate-200' color="error" onClick={() => openModal('stock-remove')} disabled={!current || items.length === 0}><RemoveCircleOutlined className='!text-[32px]' /></IconButton></span>
            </Tooltip>
          </div>
        </div>

        <Section className='flex-1 min-h-[360px] shrink-0'>
          <DataGrid<StockQuote> rows={quotes} columnDefs={columns} loading={loading} height="100%" onRowClick={setSelectedStock} selectionHeaderName="" selectionColumnWidth={36} getRowId={r => r.symbol} />
        </Section>
      </div>

      {/* 사이드 패널 */}
      <div
        aria-hidden={!panelOpen}
        className={`flex p-4 pt-0 sm:p-0 shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-in-out border-gray-200 sm:bg-white ${panelOpen ? 'sm:border-l sm:w-[320px] 2xl:w-[520px] sm:opacity-100' : 'sm:w-0 sm:opacity-0'}`}
      >
        <div className="shrink-0 w-full flex flex-col gap-3 rounded-xl bg-white border border-gray-200 sm:rounded-none sm:border-none pt-0 sm:pt-2">
          {displayStock ? (
            <>
              <div className="w-full sm:w-[320px] 2xl:w-[520px] flex flex-col gap-3.5 p-4">
                <div>
                  {/* 선택 종목 헤더 */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-foreground truncate">{displayStock.name}</span>
                    <span className="text-xs text-gray-500">{displayStock.symbol}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold tabular-nums" style={{ color: signColor(displayStock.prevDiff) }}>
                      {fmt(displayStock.price)}
                    </span>
                    <span className="text-sm font-medium tabular-nums" style={{ color: signColor(displayStock.prevDiff) }}>
                      {displayStock.prevDiff > 0 ? '+' : ''}{fmt(displayStock.prevDiff)}
                      {' '}({displayStock.change > 0 ? '+' : ''}{Number(displayStock.change).toFixed(2)}%)
                    </span>
                  </div>
                </div>

                {/* 일봉 차트 — symbol만 넘기면 DailyChart 내부에서 조회 */}
                <div className="rounded-lg border border-gray-200 overflow-hidden pl-2 pt-2">
                  <DailyChart symbol={displayStock.symbol} height={300} type="candlestick" />
                </div>

                {/* 종목 상세 — symbol만 넘기면 내부에서 조회 */}
                <StockDetailCard symbol={displayStock.symbol} />
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2  flex-1 items-center justify-center text-center text-sm text-gray-400">
              <TaskAlt className='!text-[52px]'></TaskAlt>
              <span>종목을 선택하세요</span>
            </div>
          )}
        </div>
      </div>

      {/* 그룹 추가/변경 모달 */}
      <GroupFormDialog
        open={modal === 'group-add' || modal === 'group-rename'}
        mode={modal === 'group-rename' ? 'rename' : 'add'}
        currentName={current?.groupName}
        onClose={() => setModal(null)}
        onSubmit={handleGroupSubmit}
      />

      {/* 그룹 삭제 모달 */}
      <Modal open={modal === 'group-delete'} onClose={() => setModal(null)} maxWidth="360px">
        <DialogTitle sx={{ pt: 3 }}>그룹 삭제</DialogTitle>
        <DialogContent>
          <p className="text-sm">
            <b>{current?.groupName}</b> 그룹을 삭제하시겠습니까?
          </p>
          <p className="text-xs text-gray-500 mt-1">그룹 내 관심종목도 함께 삭제됩니다.</p>
        </DialogContent>
        <DialogActions sx={{ pt: 0, pb: 3, px: 3 }}>
          <Button variant='outlined' onClick={() => setModal(null)}>취소</Button>
          <Button variant="contained" color="error" onClick={handleGroupDelete}>삭제</Button>
        </DialogActions>
      </Modal>

      {/* 종목 추가 모달 */}
      <StockAddDialog
        open={modal === 'stock-add'}
        existingSymbols={items.map(i => i.symbol)}
        onClose={() => setModal(null)}
        onAdd={handleStockAdd}
      />

      {/* 종목 삭제 모달 */}
      <StockRemoveDialog
        open={modal === 'stock-remove'}
        items={items}
        onClose={() => setModal(null)}
        onRemove={handleStockRemove}
      />
    </div>
  )
}
