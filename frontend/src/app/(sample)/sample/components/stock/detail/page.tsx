'use client'
import React, { useState } from 'react'
import { StockDetailCard } from '@/components/quote'

const SYMBOLS = [
  { symbol: '005930', name: '삼성전자' },
  { symbol: '000660', name: 'SK하이닉스' },
  { symbol: '035420', name: 'NAVER' },
]

export default function SampleStockDetailPage() {
  const [symbol, setSymbol] = useState(SYMBOLS[0].symbol)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-lg font-bold">StockDetailCard 컴포넌트</h1>
        <p className="text-sm text-gray-500 mt-1">
          종목 상세 — 종목명/코드/시가총액/상장주식수/액면가/상하한가/52주고저/PER/EPS/PBR/BPS
        </p>
      </div>

      <div className="flex gap-2">
        {SYMBOLS.map(s => (
          <button
            key={s.symbol}
            onClick={() => setSymbol(s.symbol)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              symbol === s.symbol
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <StockDetailCard symbol={symbol} />
    </div>
  )
}
