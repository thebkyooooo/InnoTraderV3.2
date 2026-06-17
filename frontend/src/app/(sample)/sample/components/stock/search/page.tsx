'use client'
import React, { useState } from 'react'
import { StockSearchModal } from '@/components/quote'
import type { StockSummary } from '@/features/stock-master/api/stock-master-api'

export default function SampleStockSearchPage() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<StockSummary | null>(null)

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-lg font-bold">StockSearchModal 컴포넌트</h1>
        <p className="text-sm text-gray-500 mt-1">
          종목명·종목코드 검색 / 최근 검색 (드래그 슬라이드) / 인기 검색 목록
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          종목 검색 열기
        </button>

        {selected && (
          <div className="flex items-center gap-2 px-3 py-2 rounded bg-gray-100 text-sm">
            <span className="font-semibold">{selected.name}</span>
            <span className="text-gray-400 text-xs">{selected.symbol}</span>
            <span className="text-gray-400 text-xs">{selected.market}</span>
          </div>
        )}
      </div>

      <StockSearchModal
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(stock) => setSelected(stock)}
      />
    </div>
  )
}
