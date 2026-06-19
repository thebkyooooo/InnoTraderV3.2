'use client'
import React, { useState } from 'react'
import { OrderBook } from '@/components/quote'

const SYMBOLS = [
  { symbol: '005930', name: '삼성전자' },
  { symbol: '000660', name: 'SK하이닉스' },
  { symbol: '035420', name: 'NAVER' },
  { symbol: '021240', name: '코웨이' },
  { symbol: '053030', name: '바이넥스' }, 
]

export default function SampleOrderBookPage() {
  const [symbol, setSymbol] = useState(SYMBOLS[0].symbol)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-lg font-bold">OrderBook 컴포넌트 (호가창)</h1>
        <p className="text-sm text-gray-500 mt-1">
          매도잔량/호가/매수잔량 — 매도10~매도1, 매수1~매수10 사다리. DOM·Canvas 2가지 렌더링 타입.
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-gray-600">DOM 기반</span>
          <OrderBook symbol={symbol} variant="dom" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-gray-600">Canvas 기반</span>
          <OrderBook symbol={symbol} variant="canvas" />
        </div>
      </div>
    </div>
  )
}
