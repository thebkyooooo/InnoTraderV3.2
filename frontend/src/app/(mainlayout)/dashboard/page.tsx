'use client'
import React, { useState } from 'react'
import { AccountSelect } from '@/components/account'
import { Card } from '@/components/ui/Card'
import Typography from '@mui/material/Typography'

import DevicesFoldOutlinedIcon from '@mui/icons-material/DevicesFoldOutlined';

export default function DashboardPage() {
  const [accountNo, setAccountNo] = useState('')
  const [panelOpen, setPanelOpen] = useState(true)

  return (

      <div className='flex flex-col sm:h-full sm:flex-row gap-4 relative'>
        <button
          type="button"
          onClick={() => setPanelOpen(v => !v)}
          aria-pressed={panelOpen}
          title={panelOpen ? '패널 숨기기' : '패널 보기'}
          className='absolute top-0 right-[-2px] hidden sm:block border border-gray-50 bg-gray-200 rounded-xl h-[43px] w-[43px]'
        >
          <DevicesFoldOutlinedIcon sx={{ fontSize: 26, color: panelOpen ? 'primary.main' : 'text.disabled' }} />
        </button>

        <div className="flex-1 flex gap-4">
          <h1 className="text-2xl font-bold text-foreground">대시보드</h1>
        </div>

        <div
          aria-hidden={!panelOpen}
          className={`shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-in-out ${panelOpen ? 'sm:w-[260px] sm:opacity-100' : 'sm:w-0 sm:opacity-0'}`}
        >
        <div className="sm:w-[260px] shrink-0 h-full flex flex-col gap-4 pt-0.5">
          {/* 계좌 셀렉트 */}
          <div className="sm:w-[calc(100%-46px)]">
            <AccountSelect fullWidth value={accountNo} onChange={setAccountNo} label="계좌 선택" placeholder="계좌번호를 선택하세요" />
          </div>
          
          <div className="sm:w-[260px] shrink-0 flex-1 flex flex-col gap-4 border rounded-l-xl border-gray-200  p-4 bg-white">
            <Card title="총 평가금액" subtitle='72,000,300원' titleSx={{fontSize: '14px'}} subtitleSx={{fontSize: '20px'}}>
              <ul className='flex flex-col text-sm'>
                <li className='flex-1 flex justify-between'><span>+12,000,000원</span><span>(+1.2%)</span></li>
              </ul>              
            </Card>

            <Card title="주문대기" subtitle='2건' titleSx={{fontSize: '14px'}}>
              <ul className='flex flex-col text-sm'>
                <li className='flex-1 flex justify-between'><span>삼성전자</span><span>10주</span></li>
                <li className='flex-1 flex justify-between'><span>SK하이닉스</span><span>10주</span></li>
              </ul>
            </Card>
            <Card title="체결완료" subtitle='3건' titleSx={{fontSize: '14px'}}>
              <ul className='flex flex-col text-sm'>
                <li className='flex-1 flex justify-between'><span>삼성전자</span><span>10주</span></li>
                <li className='flex-1 flex justify-between'><span>SK하이닉스</span><span>10주</span></li>
                <li className='flex-1 flex justify-between'><span>현대자동차</span><span>10주</span></li>
              </ul>
            </Card>
          </div>
        </div>
        </div>
      </div>
  )
}
