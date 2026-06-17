'use client'
import React, { useState } from 'react'
import { FilledQuoteGrid } from '@/components/quote'

const SYMBOLS = [
  { symbol: '005930', name: '삼성전자' },
  { symbol: '000660', name: 'SK하이닉스' },
  { symbol: '035420', name: 'NAVER' },
]

export default function SampleFilledQuotePage() {
  const [symbol, setSymbol] = useState(SYMBOLS[0].symbol)

  return (
    <div className="flex flex-col gap-4 p-4 h-full">
      <div>
        <h1 className="text-lg font-bold">FilledQuoteGrid 컴포넌트</h1>
        <p className="text-sm text-gray-500 mt-1">
          체결 시세 — 시간/현재가/전일대비/등락률/매도호가/매수호가/체결량/체결강도/거래량 · 스크롤 페이징
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

      <div className="flex-1 overflow-hidden">
        <FilledQuoteGrid symbol={symbol} />
      </div>
    </div>
  )
}
