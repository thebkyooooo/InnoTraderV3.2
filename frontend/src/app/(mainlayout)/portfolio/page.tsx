'use client'
import React, { useState } from 'react'
import { AccountSelect, Holdings } from '@/components/account'

export default function PortfolioPage() {
  const [accountNo, setAccountNo] = useState('')

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* <h1 className="text-lg font-bold text-foreground">포트폴리오</h1> */}

      {/* 계좌 셀렉트 */}
      <div className="sm:max-w-[295px] pt-2">
        <AccountSelect fullWidth value={accountNo} onChange={setAccountNo} label="계좌 선택" placeholder='계좌번호를 선택하세요' />
      </div>

      {/* 주식잔고 (요약 + 보유종목) */}
      <div className="flex-1">
        <Holdings accountNo={accountNo} height="100%" />
      </div>
    </div>
  )
}
