'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import CircularProgress from '@mui/material/CircularProgress'
import CloseIcon from '@mui/icons-material/Close'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { Input } from '@/components/ui'
import { stockMasterApi, type StockSummary } from '@/features/stock-master/api/stock-master-api'

const RECENT_KEY = 'recentStocks'
const MAX_RECENT  = 10
const MAX_POPULAR = 10

function loadRecent(): StockSummary[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') }
  catch { return [] }
}

function saveRecent(list: StockSummary[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(list))
}

function pushRecent(stock: StockSummary, current: StockSummary[]): StockSummary[] {
  return [stock, ...current.filter(s => s.symbol !== stock.symbol)].slice(0, MAX_RECENT)
}

export interface StockSearchModalProps {
  open: boolean
  onClose: () => void
  onSelect?: (stock: StockSummary) => void
}

export function StockSearchModal({ open, onClose, onSelect }: StockSearchModalProps) {
  const [query, setQuery]       = useState('')
  const [allStocks, setAll]     = useState<StockSummary[]>([])
  const [loading, setLoading]   = useState(false)
  const [recent, setRecent]     = useState<StockSummary[]>([])

  // drag-scroll refs
  const recentRef   = useRef<HTMLDivElement>(null)
  const isDragging  = useRef(false)
  const hasDragged  = useRef(false)
  const dragStartX  = useRef(0)
  const dragScrollL = useRef(0)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setRecent(loadRecent())
    if (allStocks.length > 0) return
    setLoading(true)
    stockMasterApi.getStocks()
      .then(res => setAll(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const popular       = allStocks.slice(0, MAX_POPULAR)
  const trimmed       = query.trim()
  const isSearching   = trimmed.length > 0
  const searchResults = isSearching
    ? allStocks.filter(s => s.name.includes(trimmed) || s.symbol.includes(trimmed))
    : []

  const handleSelect = useCallback((stock: StockSummary) => {
    const updated = pushRecent(stock, recent)
    setRecent(updated)
    saveRecent(updated)
    onSelect?.(stock)
    onClose()
  }, [recent, onSelect, onClose])

  const removeRecent = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = recent.filter(s => s.symbol !== symbol)
    setRecent(updated)
    saveRecent(updated)
  }

  // ── drag-scroll handlers ──
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!recentRef.current) return
    isDragging.current = true
    hasDragged.current = false
    dragStartX.current  = e.pageX - recentRef.current.getBoundingClientRect().left
    dragScrollL.current = recentRef.current.scrollLeft
  }
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !recentRef.current) return
    e.preventDefault()
    const x    = e.pageX - recentRef.current.getBoundingClientRect().left
    const walk = x - dragStartX.current
    if (Math.abs(walk) > 3) hasDragged.current = true
    recentRef.current.scrollLeft = dragScrollL.current - walk
  }
  const stopDrag = () => { isDragging.current = false }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { borderRadius: 2, height: 538, width: 380, display: 'flex', flexDirection: 'column' } } }}
    >
      <DialogTitle sx={{ pt: 3, pb: 1, fontSize: '0.95rem', fontWeight: 600 }}>
        종목 검색
        <IconButton onClick={onClose} size="medium" sx={{ position: 'absolute', right: 16, top: 16 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: '8px !important', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* 검색 입력 — 고정 */}
        <Input
          size="small"
          placeholder="종목명 또는 종목코드 입력"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
        />

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-hidden flex flex-col gap-3">
          {loading && (
            <div className="flex justify-center py-8">
              <CircularProgress size={24} />
            </div>
          )}

          {/* 기본 뷰: 최근검색 + 인기검색 */}
          {!loading && !isSearching && (
            <>
              {/* 최근 검색 — 가로 드래그 스크롤, 높이 고정 */}
              {recent.length > 0 && (
                <div className="shrink-0">
                  <p className="text-xs font-semibold text-gray-500 mb-2">최근 검색</p>
                  <div
                    ref={recentRef}
                    className="flex gap-2 overflow-x-auto pb-1 cursor-grab active:cursor-grabbing select-none"
                    style={{ scrollbarWidth: 'none' }}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={stopDrag}
                    onMouseLeave={stopDrag}
                  >
                    {recent.map(s => (
                      <div
                        key={s.symbol}
                        className="flex items-center gap-1 shrink-0 px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-700 hover:bg-gray-200 transition-colors"
                        onClick={() => { if (!hasDragged.current) handleSelect(s) }}
                      >
                        <span className="cursor-pointer">{s.name}</span>
                        <button
                          className="text-gray-400 hover:text-gray-600 leading-none ml-0.5 cursor-pointer"
                          onClick={e => removeRecent(s.symbol, e)}
                          tabIndex={-1}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 인기 검색 — 라벨 고정, ul만 스크롤 */}
              {popular.length > 0 && (
                <div className="flex flex-col flex-1 overflow-hidden gap-2">
                  <p className="text-xs font-semibold text-gray-500 shrink-0">인기 검색</p>
                  <ul className="divide-y divide-gray-100 overflow-y-auto border-t border-b border-gray-100">
                    {popular.map((s, i) => (
                      <li
                        key={s.symbol}
                        className="flex items-center gap-3 px-1 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                        onClick={() => handleSelect(s)}
                      >
                        <span className="text-xs text-gray-400 w-4 text-right shrink-0">{i + 1}</span>
                        <span className="text-sm font-medium flex-1">{s.name}</span>
                        <span className="text-xs text-gray-400 shrink-0">{s.market}</span>
                        <span className="text-xs text-gray-400 w-14 text-right shrink-0 font-mono">{s.symbol}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* 검색 결과 — ul만 스크롤 */}
          {!loading && isSearching && (
            <div className="flex-1 overflow-hidden">
              {/* 검색 결과 카운트 — 결과 있을 때만 표시 */}
              {searchResults.length > 0 && (
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  검색 결과 <span className="text-blue-500">{searchResults.length}</span>건
                </p>
              )}
              {searchResults.length === 0 ? (
                <div className="h-full text-md text-gray-400 text-center py-4 border-t border-b border-gray-100">검색 결과가 없습니다.</div>
              ) : (
                <ul className="divide-y divide-gray-100 overflow-y-auto h-full border-t border-b border-gray-100">
                  {searchResults.map(s => (
                    <li
                      key={s.symbol}
                      className="flex items-center gap-3 px-1 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                      onClick={() => handleSelect(s)}
                    >
                      <span className="text-sm font-medium flex-1">{s.name}</span>
                      <span className="text-xs text-gray-400 shrink-0">{s.market}</span>
                      <span className="text-xs text-gray-400 w-14 text-right shrink-0 font-mono">{s.symbol}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
