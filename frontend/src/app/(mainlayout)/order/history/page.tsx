'use client'
import React, { useState } from 'react'
import { AccountSelect } from '@/components/account'
import { OrderHistory } from '@/components/order'

export default function OrderHistoryPage() {
  const [accountNo, setAccountNo] = useState('')

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* 계좌 셀렉트 */}
      <div className="sm:max-w-[295px]">
        <AccountSelect fullWidth value={accountNo} onChange={setAccountNo} label="계좌 선택" placeholder="계좌번호를 선택하세요" />
      </div>

      {/* 주문내역 (조회구분 + 요약 + 그리드) */}
      <div className="flex-1">
        <OrderHistory accountNo={accountNo} height="100%" />
      </div>
    </div>
  )
}
