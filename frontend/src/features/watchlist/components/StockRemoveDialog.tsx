'use client'
import React, { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import type { WatchlistItem } from '@/features/watchlist/api/watchlist-api'

export interface StockRemoveDialogProps {
  open: boolean
  items: WatchlistItem[]
  /** 그리드에서 선택해 둔 종목코드 (초기 체크 상태) */
  preselected?: string[]
  onClose: () => void
  onRemove: (symbols: string[]) => void
}

export function StockRemoveDialog({ open, items, preselected = [], onClose, onRemove }: StockRemoveDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) setSelected(new Set(preselected))
  }, [open, preselected])

  const toggle = (symbol: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(symbol) ? n.delete(symbol) : n.add(symbol); return n })

  const submit = () => { if (selected.size) onRemove([...selected]) }

  return (
    <Modal open={open} onClose={onClose} maxWidth="360px">
      <DialogTitle sx={{ pt: 3 }}>종목 삭제 {selected.size > 0 && <span className="text-sm text-red-600">({selected.size})</span>}</DialogTitle>
      <DialogContent>
        <p className="text-xs text-gray-500 mb-2">삭제할 종목을 선택하세요.</p>
        <div className="max-h-[320px] overflow-y-auto border border-gray-200 rounded">
          {items.length === 0 && (
            <div className="text-xs text-gray-400 text-center py-6">종목이 없습니다.</div>
          )}
          {items.map(it => (
            <label key={it.symbol}
              className="flex items-center gap-2 px-2 py-1.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer text-sm">
              <Checkbox size="small" checked={selected.has(it.symbol)} onChange={() => toggle(it.symbol)} sx={{ p: 0.5 }} />
              <span className="font-medium">{it.name}</span>
              <span className="ml-auto text-gray-400 tabular-nums">{it.symbol}</span>
            </label>
          ))}
        </div>
      </DialogContent>
      <DialogActions sx={{ pt: 0, pb: 3, px: 3 }}>
        <Button variant='outlined' onClick={onClose}>취소</Button>
        <Button variant="contained" color="error" onClick={submit} disabled={selected.size === 0}>
          {selected.size > 0 ? `${selected.size}개 삭제` : '삭제'}
        </Button>
      </DialogActions>
    </Modal>
  )
}
