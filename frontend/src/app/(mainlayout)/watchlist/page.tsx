'use client'
import React, { useCallback, useEffect, useState } from 'react'
import type { ColDef } from 'ag-grid-community'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined'
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import Button from '@mui/material/Button'
import { Modal } from '@/components/ui/Modal'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { Select } from '@/components/ui/Select'
import { DataGrid } from '@/components/ui/DataGrid'
import { watchlistApi, type WatchlistGroup, type WatchlistItem } from '@/features/watchlist/api/watchlist-api'
import { stockMasterApi, type StockQuote } from '@/features/stock-master/api/stock-master-api'
import { GroupFormDialog } from '@/features/watchlist/components/GroupFormDialog'
import { StockAddDialog } from '@/features/watchlist/components/StockAddDialog'
import { StockRemoveDialog } from '@/features/watchlist/components/StockRemoveDialog'
import { useAuthStore } from '@/store/auth-store'

// ── 그리드 ──────────────────────────────────────────────────────────────────────

const UP = '#ef5350', DOWN = '#4285f4'
const fmt = (n: number) => (n ?? 0).toLocaleString('ko-KR')
const signColor = (v: number) => (v > 0 ? UP : v < 0 ? DOWN : '#6b7280')
const right = { textAlign: 'right' as const }
const center = { textAlign: 'center' as const }

const columns: ColDef<StockQuote>[] = [
  { field: 'name',        headerName: '종목명',     flex: 1, minWidth: 120 },
  { field: 'symbol',      headerName: '종목코드',   width: 100, cellStyle: center },
  { field: 'market',      headerName: '시장구분',   width: 90,  cellStyle: center },
  { field: 'price',       headerName: '종가',       width: 100, cellStyle: right, valueFormatter: p => fmt(p.value) },
  { field: 'prevDiff',    headerName: '전일대비',   width: 100, cellStyle: p => ({ ...right, color: signColor(p.value), fontWeight: 600 }), valueFormatter: p => `${p.value > 0 ? '+' : ''}${fmt(p.value)}` },
  { field: 'change',      headerName: '등락률',     width: 90,  cellStyle: p => ({ ...right, color: signColor(p.value), fontWeight: 600 }), valueFormatter: p => `${p.value > 0 ? '+' : ''}${Number(p.value).toFixed(2)}%` },
  { field: 'open',        headerName: '시가',       width: 100, cellStyle: right, valueFormatter: p => fmt(p.value) },
  { field: 'high',        headerName: '고가',       width: 100, cellStyle: right, valueFormatter: p => fmt(p.value) },
  { field: 'low',         headerName: '저가',       width: 100, cellStyle: right, valueFormatter: p => fmt(p.value) },
  { field: 'volume',      headerName: '거래량',     width: 120, cellStyle: right, valueFormatter: p => fmt(p.value) },
  { field: 'turnoverMan', headerName: '거래금액(만)', width: 130, cellStyle: right, valueFormatter: p => fmt(p.value) },
]

type ModalType = 'group-add' | 'group-rename' | 'group-delete' | 'stock-add' | 'stock-remove' | null

// ── 페이지 ──────────────────────────────────────────────────────────────────────

export default function WatchlistPage() {
  const [groups, setGroups]           = useState<WatchlistGroup[]>([])
  const [selectedCode, setSelectedCode] = useState('')
  const [items, setItems]             = useState<WatchlistItem[]>([])
  const [quotes, setQuotes]           = useState<StockQuote[]>([])
  const [loading, setLoading]         = useState(false)
  const [modal, setModal]             = useState<ModalType>(null)

  const current = groups.find(g => g.groupCode === selectedCode)

  // ── 그룹 목록 ────────────────────────────────────────────────────────────────
  const loadGroups = useCallback(async (preferCode?: string) => {
    const res = await watchlistApi.listGroups()
    const list = res.data
    setGroups(list)
    setSelectedCode(prev => {
      const keep = preferCode ?? prev
      if (list.some(g => g.groupCode === keep)) return keep
      return list[0]?.groupCode ?? ''
    })
  }, [])

  // AT는 메모리 저장이라 새로고침 시 사라진다 → 재발급으로 토큰이 준비된 뒤 조회
  // (토큰 없이 호출하면 백엔드가 403을 반환하고 인터셉터가 복구하지 못함)
  const accessToken = useAuthStore(s => s.accessToken)
  useEffect(() => {
    if (!accessToken) return
    loadGroups().catch(() => setGroups([]))
  }, [accessToken, loadGroups])

  // ── 선택 그룹의 종목 + 시세 ──────────────────────────────────────────────────
  const loadItems = useCallback(async (code: string) => {
    if (!code) { setItems([]); setQuotes([]); return }
    setLoading(true)
    try {
      const detail = (await watchlistApi.getItems(code)).data
      setItems(detail.items)
      if (detail.items.length) {
        const q = await stockMasterApi.getBatch(detail.items.map(i => i.symbol))
        setQuotes(q.data)
      } else {
        setQuotes([])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadItems(selectedCode).catch(() => { setItems([]); setQuotes([]) }) }, [selectedCode, loadItems])

  // ── 변경 핸들러 ──────────────────────────────────────────────────────────────
  const handleGroupSubmit = async (name: string) => {
    if (modal === 'group-add') {
      const list = (await watchlistApi.createGroup(name)).data
      setGroups(list)
      // 가장 큰 코드 = 방금 생성된 그룹
      const newest = list.reduce<WatchlistGroup | undefined>((m, g) => (!m || g.groupCode > m.groupCode ? g : m), undefined)
      setSelectedCode(newest?.groupCode ?? selectedCode)
    } else if (modal === 'group-rename' && selectedCode) {
      setGroups((await watchlistApi.renameGroup(selectedCode, name)).data)
    }
    setModal(null)
  }

  const handleGroupDelete = async () => {
    if (selectedCode) {
      const list = (await watchlistApi.deleteGroup(selectedCode)).data
      setGroups(list)
      setSelectedCode(list[0]?.groupCode ?? '')
    }
    setModal(null)
  }

  const handleStockAdd = async (symbols: string[]) => {
    if (selectedCode) {
      await watchlistApi.addItems(selectedCode, symbols)
      await Promise.all([loadItems(selectedCode), loadGroups(selectedCode)])
    }
    setModal(null)
  }

  const handleStockRemove = async (symbols: string[]) => {
    if (selectedCode) {
      await watchlistApi.removeItems(selectedCode, symbols)
      await Promise.all([loadItems(selectedCode), loadGroups(selectedCode)])
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
    <div className="flex flex-col gap-4 w-full h-full">
      {/* <h1 className="text-lg font-bold text-foreground">관심종목</h1> */}

      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[200px]">
          <Select
            fullWidth size="small" label="관심그룹 선택"
            value={selectedCode}
            onChange={setSelectedCode}
            options={groups.map(g => ({ label: `${g.groupName} (${g.itemCount})`, value: g.groupCode }))}
          />
        </div>

        <div className="flex flex-wrap gap-1.5 items-center ml-auto">
          <div className='w-[24px] text-xs leading-[13px]'>그룹관리</div>
          <Tooltip title="그룹추가">
            <IconButton className='!p-0 !bg-slate-200' onClick={() => openModal('group-add')}><CreateNewFolderOutlinedIcon className='!text-[32px]' /></IconButton>
          </Tooltip>
          <Tooltip title="그룹변경">
            <span><IconButton className='!p-0 !bg-slate-200' onClick={() => openModal('group-rename')} disabled={!current}><DriveFileRenameOutlineIcon className='!text-[32px]' /></IconButton></span>
          </Tooltip>
          <Tooltip title="그룹삭제">
            <span><IconButton className='!p-0 !bg-slate-200' color="error" onClick={() => openModal('group-delete')} disabled={!current}><DeleteOutlineIcon className='!text-[32px]' /></IconButton></span>
          </Tooltip>
          <div className='w-[24px] text-xs leading-[13px] ml-2'>종목관리</div>
          <Tooltip title="종목추가">
            <span><IconButton className='!p-0 !bg-slate-200' color="primary" onClick={() => openModal('stock-add')} disabled={!current}><AddCircleOutlineIcon className='!text-[32px]' /></IconButton></span>
          </Tooltip>
          <Tooltip title="종목삭제">
            <span><IconButton className='!p-0 !bg-slate-200' color="error" onClick={() => openModal('stock-remove')} disabled={!current || items.length === 0}><RemoveCircleOutlineIcon className='!text-[32px]' /></IconButton></span>
          </Tooltip>
        </div>
      </div>

      <div className="flex-1 min-h-[360px]">
        <DataGrid<StockQuote> rows={quotes} columnDefs={columns} loading={loading} height="100%" />
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
