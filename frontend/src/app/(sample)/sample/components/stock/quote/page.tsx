'use client'
import React, { useState, useEffect } from 'react'
import { QuoteBoard } from '@/components/quote'
import { quoteApi, type QuotePriceResponse } from '@/features/quote/api/quote-api'

const SYMBOLS = [
  { symbol: '005930', name: '삼성전자' },
  { symbol: '000660', name: 'SK하이닉스' },
  { symbol: '035420', name: 'NAVER' },
]

export default function SampleComponentsQuotePage() {
  const [selectedSymbol, setSelectedSymbol] = useState(SYMBOLS[0].symbol)
  const [data, setData] = useState<QuotePriceResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    quoteApi.getPrice(selectedSymbol)
      .then((res) => setData(res.data))
      .catch(() => setError('데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [selectedSymbol])

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-lg font-bold">QuoteBoard 컴포넌트</h1>
        <p className="text-sm text-gray-500 mt-1">
          종목명 / 종목코드 / 시장구분 / 현재가 / 전일대비 / 등락률 및 시세 지표를 표시하는 컴포넌트
        </p>
      </div>

      <div className="flex gap-2">
        {SYMBOLS.map((s) => (
          <button
            key={s.symbol}
            onClick={() => setSelectedSymbol(s.symbol)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              selectedSymbol === s.symbol
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-sm text-gray-400">불러오는 중...</div>
      )}

      {error && (
        <div className="text-sm text-red-500">{error}</div>
      )}

      {!loading && !error && data && (
        <QuoteBoard
          symbol={data.symbol}
          name={data.name}
          market={data.market}
          price={data.price}
          prevDiff={data.prevDiff}
          change={data.change}
          volume={data.volume}
          open={data.open}
          high={data.high}
          low={data.low}
          prevClose={data.prevClose}
          upperLimit={data.upperLimit}
          lowerLimit={data.lowerLimit}
          tradingAmount={data.tradingAmount}
          onStockSelect={(stock) => setSelectedSymbol(stock.symbol)}
        />
      )}
    </div>
  )
}
