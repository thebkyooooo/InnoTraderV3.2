'use client'
import React, { useState } from 'react'
import { AccountSelect, Holdings } from '@/components/account'

export default function SampleAccountPage() {
  const [accountNo, setAccountNo] = useState('')

  return (
    <div className="flex flex-col gap-4 p-4 h-full">
      <div>
        <h1 className="text-lg font-bold">보유주식 컴포넌트</h1>
        <p className="text-sm text-gray-500 mt-1">
          AccountSelect(계좌목록) + Holdings(주식잔고 요약·목록) — 인증 필요 (로그인 후 표시)
        </p>
      </div>

      <div className="max-w-sm">
        <AccountSelect value={accountNo} onChange={setAccountNo} />
      </div>

      <div className="flex-1 min-h-0">
        <Holdings accountNo={accountNo} height="100%" />
      </div>
    </div>
  )
}
