'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import { stockMasterApi, type StockSummary } from '@/features/stock-master/api/stock-master-api'

export interface StockAddDialogProps {
  open: boolean
  /** 이미 그룹에 담긴 종목코드 (선택 목록에서 제외) */
  existingSymbols: string[]
  onClose: () => void
  onAdd: (symbols: string[]) => void
}

export function StockAddDialog({ open, existingSymbols, onClose, onAdd }: StockAddDialogProps) {
  const [stocks, setStocks]   = useState<StockSummary[]>([])
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    setKeyword('')
    setSelected(new Set())
    stockMasterApi.getStocks('ALL').then(res => setStocks(res.data)).catch(() => setStocks([]))
  }, [open])

  const existing = useMemo(() => new Set(existingSymbols), [existingSymbols])

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return stocks
      .filter(s => !existing.has(s.symbol))
      .filter(s => !kw || s.name.toLowerCase().includes(kw) || s.symbol.includes(kw))
      .slice(0, 200)
  }, [stocks, keyword, existing])

  const toggle = (symbol: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(symbol) ? n.delete(symbol) : n.add(symbol); return n })

  const submit = () => { if (selected.size) onAdd([...selected]) }

  return (
    <Modal open={open} onClose={onClose} maxWidth="360px">
      <DialogTitle sx={{ pt: 3 }}>
        종목 추가 {selected.size > 0 && <span className="text-sm text-blue-600">({selected.size})</span>}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus fullWidth size="small" placeholder="종목명 또는 코드 검색"
          value={keyword} onChange={e => setKeyword(e.target.value)} sx={{ mb: 1 }}
        />
        <div className="h-[320px] overflow-y-auto border-t border-b border-gray-200 rounded">
          {filtered.length === 0 && (
            <div className="text-xs text-gray-400 text-center py-6">검색 결과가 없습니다.</div>
          )}
          {filtered.map(s => (
            <label key={s.symbol}
              className="flex items-center gap-2 px-0 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer text-sm">
              <Checkbox size="small" checked={selected.has(s.symbol)} onChange={() => toggle(s.symbol)} sx={{ p: 0 }} />
              <span className="flex-1 font-medium">{s.name}</span>
              <span className="ml-auto text-xs text-gray-500">{s.market}</span>
              <span className="ml-auto text-gray-400 tabular-nums">{s.symbol}</span>
            </label>
          ))}
        </div>
      </DialogContent>
      <DialogActions sx={{ pt: 0, pb: 3, px: 3 }}>
        <Button variant='outlined' onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={submit} disabled={selected.size === 0}>
          {selected.size > 0 ? `${selected.size}개 추가` : '추가'}
        </Button>
      </DialogActions>
    </Modal>
  )
}
