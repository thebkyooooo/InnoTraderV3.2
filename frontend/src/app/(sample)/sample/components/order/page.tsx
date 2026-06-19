'use client'
import React, { useState } from 'react'
import { AccountSelect } from '@/components/account'
import { OrderForm, OrderHistory } from '@/components/order'

// 데모용 종목 (현재가 포함)
const DEMO = { symbol: '005930', name: '삼성전자', currentPrice: 72300 }

export default function SampleOrderPage() {
  const [accountNo, setAccountNo] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="flex flex-col gap-4 p-4 h-full">
      <div>
        <h1 className="text-lg font-bold">주문 컴포넌트</h1>
        <p className="text-sm text-gray-500 mt-1">
          OrderForm(주문폼) + OrderHistory(주문내역) — 인증 필요 (로그인 후 표시)
        </p>
      </div>

      <div className="max-w-[295px] mb-3">
        <AccountSelect value={accountNo} onChange={setAccountNo} placeholder="계좌번호를 선택하세요" />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* 주문내역 */}
        <div className="flex-1 min-h-[400px]">
          <OrderHistory key={refreshKey} accountNo={accountNo} height="100%" />
        </div>

        {/* 주문폼 */}
        <div className="w-full lg:w-[320px] shrink-0 rounded-lg border border-gray-200 p-4 mb-auto bg-white">
          <OrderForm
            accountNo={accountNo}
            symbol={DEMO.symbol}
            name={DEMO.name}
            currentPrice={DEMO.currentPrice}
            onOrdered={() => setRefreshKey(k => k + 1)}
          />
        </div>
      </div>
    </div>
  )
}
