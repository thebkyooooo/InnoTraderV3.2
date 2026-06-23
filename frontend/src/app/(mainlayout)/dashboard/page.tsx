'use client'
import React, { useState } from 'react'
import { AccountSelect } from '@/components/account'
import { Card } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { ArrowForwardIosSharp, FormatIndentIncreaseOutlined } from '@mui/icons-material';

interface StockRankinRows {
  name: string
  code: string
  price: number
  /** 등락률 (%) */
  change: number
  /** 전일대비 (절대값) */
  prevdiff: number
}

const stockRankinRows: StockRankinRows[] = [
  { name: '삼성전자', code: '005930', price: 72300, change: 1.2, prevdiff: 1870 },
  { name: 'SK하이닉스', code: '000660', price: 198500, change: -0.8, prevdiff: 870 },
  { name: 'NAVER', code: '035420', price: 215000, change: 0.5, prevdiff: 870 },
  { name: 'Kakao', code: '035720', price: 48500, change: -2.1, prevdiff: 870 },
  { name: 'LG에너지솔루션', code: '373220', price: 385000, change: 3.2, prevdiff: 870 },
  { name: '현대자동차', code: '005380', price: 245000, change: 0.8, prevdiff: 870 },
  { name: 'LG전자', code: '066570', price: 245000, change: 0.8, prevdiff: 870 },
]

export default function DashboardPage() {
  const [accountNo, setAccountNo] = useState('')
  const [panelOpen, setPanelOpen] = useState(true)
  const [segment01, setSegment01] = useState('kospi')
  const [segment02, setSegment02] = useState('kospi')
  const [segment03, setSegment03] = useState('kospi')
  const [segment04, setSegment04] = useState('kospi')
  const [segment05, setSegment05] = useState('kospi')
  const [segment06, setSegment06] = useState('kospi')

  return (

      <div aria-pressed={panelOpen} className={`flex flex-col sm:h-full sm:flex-row relative ${panelOpen ? 'gap-4' : 'gap-4 sm:gap-0'}`}>
        <button
          type="button"
          onClick={() => setPanelOpen(v => !v)}
          aria-pressed={panelOpen}
          title={panelOpen ? '패널 숨기기' : '패널 보기'}
          className={`absolute hidden sm:block border border-gray-50 bg-slate-200 rounded-r-xl h-[42px] w-[20px] transition-transform ${panelOpen ? 'top-[15px] right-[-20px]' : 'top-[15px] right-[-24px] rotate-180'}`}
        >
          <ArrowForwardIosSharp sx={{ fontSize: 20, color: 'text.disabled' }} />
        </button>

        <div 
          aria-hidden={!panelOpen}
          className={`@container flex-1 flex flex-col gap-4 shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-in-out ${panelOpen ? 'w-full' : 'w-full sm:w-[calc(100%-274px)]'}`}
        >
          {/* <h1 className="text-2xl font-bold text-foreground">대시보드</h1> */}
          
          {/* 글로벌지수 */}
          <div className='w-full grid grid-cols-[repeat(auto-fit,minmax(136px,1fr))] gap-1'>
            <Card title="KOSPI" subtitle='72,000,300' sx={{width: '100%'}} titleSx={{fontSize: '14px'}} subtitleSx={{fontSize: '20px'}}>
              <ul className='flex flex-col text-sm'>
                <li className='flex-1 flex justify-between'><span>+1,000</span><span>(+1.2%)</span></li>
              </ul>              
            </Card>
            <Card title="KOSDAQ" subtitle='72,000,300' sx={{width: '100%'}} titleSx={{fontSize: '14px'}} subtitleSx={{fontSize: '20px'}}>
              <ul className='flex flex-col text-sm'>
                <li className='flex-1 flex justify-between'><span>+1,000</span><span>(+1.2%)</span></li>
              </ul>              
            </Card>
            <Card title="NASDAQ" subtitle='72,000,300' sx={{width: '100%'}} titleSx={{fontSize: '14px'}} subtitleSx={{fontSize: '20px'}}>
              <ul className='flex flex-col text-sm'>
                <li className='flex-1 flex justify-between'><span>+1,000</span><span>(+1.2%)</span></li>
              </ul>              
            </Card>
            <Card title="S&P 500" subtitle='72,000,300' sx={{width: '100%'}} titleSx={{fontSize: '14px'}} subtitleSx={{fontSize: '20px'}}>
              <ul className='flex flex-col text-sm'>
                <li className='flex-1 flex justify-between'><span>+1,000</span><span>(+1.2%)</span></li>
              </ul>              
            </Card>
          </div>

          <div className='w-full grid grid-cols-1 @[500px]:grid-cols-2 @[1024px]:grid-cols-3 gap-4'>
            <div className='w-full flex flex-col gap-2'>
              <div className='w-full flex gap-2 justify-between items-center'>
                <h2 className='text-sm font-semibold'>시가총액상위</h2>
                <SegmentedControl
                  value={segment01}
                  onChange={setSegment01}
                  options={[
                    { label: '코스피', value: 'kospi' },
                    { label: '코스닥', value: 'kosdaq' },
                  ]}
                  size="small"
                />
              </div>
              
              <Card>
                <div className='flex flex-col gap-2'>
                  <ul className='flex flex-col gap-2'>
                    {stockRankinRows.map((s, i) => {
                      const up = s.change >= 0
                      const color = up ? 'text-red-500' : 'text-blue-500'
                      const sign = up ? '+' : '-'
                      return (
                        <li key={`${s.code}-${i}`} className='flex-1 flex justify-between text-sm font-semibold gap-2'>
                          <div>{s.name}</div>
                          <div className='flex flex-col items-end'>
                            <p>{s.price.toLocaleString()}</p>
                            <p className={`text-[12px] font-normal ${color}`}>
                              <span>{sign}{s.prevdiff.toLocaleString()}</span>
                              <span> ({sign}{Math.abs(s.change)}%)</span>
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </Card>
            </div>
            <div className='w-full flex flex-col gap-2'>
              <div className='w-full flex gap-2 justify-between items-center'>
                <h2 className='text-sm font-semibold'>거래량상위</h2>
                <SegmentedControl
                  value={segment02}
                  onChange={setSegment02}
                  options={[
                    { label: '코스피', value: 'kospi' },
                    { label: '코스닥', value: 'kosdaq' },
                  ]}
                  size="small"
                />
              </div>
              
              <Card>
                <div className='flex flex-col gap-2'>
                  <ul className='flex flex-col gap-2'>
                    {stockRankinRows.map((s, i) => {
                      const up = s.change >= 0
                      const color = up ? 'text-red-500' : 'text-blue-500'
                      const sign = up ? '+' : '-'
                      return (
                        <li key={`${s.code}-${i}`} className='flex-1 flex justify-between text-sm font-semibold gap-2'>
                          <div>{s.name}</div>
                          <div className='flex flex-col items-end'>
                            <p>{s.price.toLocaleString()}</p>
                            <p className={`text-[12px] font-normal ${color}`}>
                              <span>{sign}{s.prevdiff.toLocaleString()}</span>
                              <span> ({sign}{Math.abs(s.change)}%)</span>
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </Card>
            </div>
            <div className='w-full flex flex-col gap-2'>
              <div className='w-full flex gap-2 justify-between items-center'>
                <h2 className='text-sm font-semibold'>상승종목</h2>
                <SegmentedControl
                  value={segment03}
                  onChange={setSegment03}
                  options={[
                    { label: '코스피', value: 'kospi' },
                    { label: '코스닥', value: 'kosdaq' },
                  ]}
                  size="small"
                />
              </div>
              
              <Card>
                <div className='flex flex-col gap-2'>
                  <ul className='flex flex-col gap-2'>
                    {stockRankinRows.map((s, i) => {
                      const up = s.change >= 0
                      const color = up ? 'text-red-500' : 'text-blue-500'
                      const sign = up ? '+' : '-'
                      return (
                        <li key={`${s.code}-${i}`} className='flex-1 flex justify-between text-sm font-semibold gap-2'>
                          <div>{s.name}</div>
                          <div className='flex flex-col items-end'>
                            <p>{s.price.toLocaleString()}</p>
                            <p className={`text-[12px] font-normal ${color}`}>
                              <span>{sign}{s.prevdiff.toLocaleString()}</span>
                              <span> ({sign}{Math.abs(s.change)}%)</span>
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </Card>
            </div>
            <div className='w-full flex flex-col gap-2'>
              <div className='w-full flex gap-2 justify-between items-center'>
                <h2 className='text-sm font-semibold'>하락종목</h2>
                <SegmentedControl
                  value={segment04}
                  onChange={setSegment04}
                  options={[
                    { label: '코스피', value: 'kospi' },
                    { label: '코스닥', value: 'kosdaq' },
                  ]}
                  size="small"
                />
              </div>
              
              <Card>
                <div className='flex flex-col gap-2'>
                  <ul className='flex flex-col gap-2'>
                    {stockRankinRows.map((s, i) => {
                      const up = s.change >= 0
                      const color = up ? 'text-red-500' : 'text-blue-500'
                      const sign = up ? '+' : '-'
                      return (
                        <li key={`${s.code}-${i}`} className='flex-1 flex justify-between text-sm font-semibold gap-2'>
                          <div>{s.name}</div>
                          <div className='flex flex-col items-end'>
                            <p>{s.price.toLocaleString()}</p>
                            <p className={`text-[12px] font-normal ${color}`}>
                              <span>{sign}{s.prevdiff.toLocaleString()}</span>
                              <span> ({sign}{Math.abs(s.change)}%)</span>
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </Card>
            </div>
            <div className='w-full flex flex-col gap-2'>
              <div className='w-full flex gap-2 justify-between items-center'>
                <h2 className='text-sm font-semibold'>갭상승종목</h2>
                <SegmentedControl
                  value={segment05}
                  onChange={setSegment05}
                  options={[
                    { label: '코스피', value: 'kospi' },
                    { label: '코스닥', value: 'kosdaq' },
                  ]}
                  size="small"
                />
              </div>
              
              <Card>
                <div className='flex flex-col gap-2'>
                  <ul className='flex flex-col gap-2'>
                    {stockRankinRows.map((s, i) => {
                      const up = s.change >= 0
                      const color = up ? 'text-red-500' : 'text-blue-500'
                      const sign = up ? '+' : '-'
                      return (
                        <li key={`${s.code}-${i}`} className='flex-1 flex justify-between text-sm font-semibold gap-2'>
                          <div>{s.name}</div>
                          <div className='flex flex-col items-end'>
                            <p>{s.price.toLocaleString()}</p>
                            <p className={`text-[12px] font-normal ${color}`}>
                              <span>{sign}{s.prevdiff.toLocaleString()}</span>
                              <span> ({sign}{Math.abs(s.change)}%)</span>
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </Card>
            </div>
            <div className='w-full flex flex-col gap-2'>
              <div className='w-full flex gap-2 justify-between items-center'>
                <h2 className='text-sm font-semibold'>투자심리과열종목</h2>
                <SegmentedControl
                  value={segment06}
                  onChange={setSegment06}
                  options={[
                    { label: '코스피', value: 'kospi' },
                    { label: '코스닥', value: 'kosdaq' },
                  ]}
                  size="small"
                />
              </div>
              
              <Card>
                <div className='flex flex-col gap-2'>
                  <ul className='flex flex-col gap-2'>
                    {stockRankinRows.map((s, i) => {
                      const up = s.change >= 0
                      const color = up ? 'text-red-500' : 'text-blue-500'
                      const sign = up ? '+' : '-'
                      return (
                        <li key={`${s.code}-${i}`} className='flex-1 flex justify-between text-sm font-semibold gap-2'>
                          <div>{s.name}</div>
                          <div className='flex flex-col items-end'>
                            <p>{s.price.toLocaleString()}</p>
                            <p className={`text-[12px] font-normal ${color}`}>
                              <span>{sign}{s.prevdiff.toLocaleString()}</span>
                              <span> ({sign}{Math.abs(s.change)}%)</span>
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </Card>
            </div>
          </div>

          <div className='w-full flex flex-col gap-2'>
            <div className='w-full flex gap-2 justify-between items-center'>
              <h2 className='text-sm font-semibold'>인기검색종목</h2>
            </div>

            <div className='w-full overflow-auto'>
              <div className='flex gap-1 min-w-[800px]'>
                <Card title="삼성전자" subtitle='300,300' sx={{width: '100%', minWidth: '200px'}} titleSx={{fontSize: '14px'}} subtitleSx={{fontSize: '20px'}}>
                  <ul className='flex flex-col text-sm mt-7'>
                    <li className='flex-1 flex flex-col'><span>+1,000</span><span>(+1.2%)</span></li>
                  </ul>              
                </Card>
                <Card title="삼성전자" subtitle='300,300' sx={{width: '100%', minWidth: '200px'}} titleSx={{fontSize: '14px'}} subtitleSx={{fontSize: '20px'}}>
                  <ul className='flex flex-col text-sm mt-7'>
                    <li className='flex-1 flex flex-col'><span>+1,000</span><span>(+1.2%)</span></li>
                  </ul>              
                </Card>
                <Card title="삼성전자" subtitle='300,300' sx={{width: '100%', minWidth: '200px'}} titleSx={{fontSize: '14px'}} subtitleSx={{fontSize: '20px'}}>
                  <ul className='flex flex-col text-sm mt-7'>
                    <li className='flex-1 flex flex-col'><span>+1,000</span><span>(+1.2%)</span></li>
                  </ul>              
                </Card>
                <Card title="삼성전자" subtitle='300,300' sx={{width: '100%', minWidth: '200px'}} titleSx={{fontSize: '14px'}} subtitleSx={{fontSize: '20px'}}>
                  <ul className='flex flex-col text-sm mt-7'>
                    <li className='flex-1 flex flex-col'><span>+1,000</span><span>(+1.2%)</span></li>
                  </ul>              
                </Card>
                <Card title="삼성전자" subtitle='300,300' sx={{width: '100%', minWidth: '200px'}} titleSx={{fontSize: '14px'}} subtitleSx={{fontSize: '20px'}}>
                  <ul className='flex flex-col text-sm mt-7'>
                    <li className='flex-1 flex flex-col'><span>+1,000</span><span>(+1.2%)</span></li>
                  </ul>              
                </Card>
              </div>
            </div>
          </div>
        </div>

        <div
          aria-hidden={!panelOpen}
          className={`shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-in-out ${panelOpen ? 'sm:w-[260px] sm:opacity-100' : 'sm:w-0 sm:opacity-0'}`}
        >
        <div className="sm:w-[260px] shrink-0 flex flex-col gap-4">
          <div className="sm:w-[260px] shrink-0 flex-1 flex flex-col gap-4 border rounded-l-2xl border-gray-200  p-4 bg-slate-200">
            {/* 계좌 셀렉트 */}
            <AccountSelect fullWidth value={accountNo} onChange={setAccountNo} label="계좌 선택" placeholder="계좌번호를 선택하세요" />

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
              <button className='flex gap-1 items-center mt-2 ml-auto'>
                <span className='text-sm text-gray-500'>더보기</span>
                <FormatIndentIncreaseOutlined sx={{ fontSize: 15, color: 'text.disabled' }} />
              </button>
            </Card>
            <Card title="체결완료" subtitle='3건' titleSx={{fontSize: '14px'}}>
              <ul className='flex flex-col text-sm'>
                <li className='flex-1 flex justify-between'><span>삼성전자</span><span>10주</span></li>
                <li className='flex-1 flex justify-between'><span>SK하이닉스</span><span>10주</span></li>
                <li className='flex-1 flex justify-between'><span>현대자동차</span><span>10주</span></li>
              </ul>
              <button className='flex gap-1 items-center mt-2 ml-auto'>
                <span className='text-sm text-gray-500'>더보기</span>
                <FormatIndentIncreaseOutlined sx={{ fontSize: 15, color: 'text.disabled' }} />
              </button>
            </Card>
            <Card title="보유주식" subtitle='10종목' titleSx={{fontSize: '14px'}}>
              <ul className='flex flex-col text-sm'>
                <li className='flex-1 flex justify-between'><span>삼성전자</span><span>10주</span></li>
                <li className='flex-1 flex justify-between'><span>SK하이닉스</span><span>10주</span></li>
                <li className='flex-1 flex justify-between'><span>현대자동차</span><span>10주</span></li>
                <li className='flex-1 flex justify-between'><span>현대자동차</span><span>10주</span></li>
                <li className='flex-1 flex justify-between'><span>현대자동차</span><span>10주</span></li>
              </ul>
              <button className='flex gap-1 items-center mt-2 ml-auto'>
                <span className='text-sm text-gray-500'>더보기</span>
                <FormatIndentIncreaseOutlined sx={{ fontSize: 15, color: 'text.disabled' }} />
              </button>
            </Card>
          </div>
        </div>
        </div>
      </div>
  )
}
