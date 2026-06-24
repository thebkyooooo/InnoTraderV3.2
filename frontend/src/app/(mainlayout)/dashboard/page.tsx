'use client'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { AccountSelect } from '@/components/account'
import { Card } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { ArrowForwardIosSharp, FormatIndentIncreaseOutlined } from '@mui/icons-material';
import { holdingApi, type HoldingsResponse } from '@/features/holding/api/holding-api'
import { orderApi, type OrderHistoryResponse } from '@/features/order/api/order-api'

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

// 손익 부호 색상 (이익=빨강, 손실=파랑)
const pnlClass = (v: number) => (v > 0 ? 'text-red-500' : v < 0 ? 'text-blue-500' : 'text-gray-500')
const signed = (v: number) => `${v > 0 ? '+' : ''}${v.toLocaleString()}`

export default function DashboardPage() {
  const [accountNo, setAccountNo] = useState('')
  const [panelOpen, setPanelOpen] = useState(true)

  // ── MY 계좌 사이드 패널 데이터 ────────────────────────────────────────────────
  const [holdings, setHoldings]           = useState<HoldingsResponse | null>(null)
  const [pendingOrders, setPendingOrders] = useState<OrderHistoryResponse | null>(null)
  const [filledOrders, setFilledOrders]   = useState<OrderHistoryResponse | null>(null)

  useEffect(() => {
    if (!accountNo) { setHoldings(null); setPendingOrders(null); setFilledOrders(null); return }
    let cancelled = false
    Promise.allSettled([
      holdingApi.getHoldings(accountNo),                       // 평가금액 + 보유주식
      orderApi.getHistory({ accountNo, fill: 'UNFILLED' }),    // 주문대기(미체결)
      orderApi.getHistory({ accountNo, fill: 'FILLED' }),      // 체결완료
    ]).then(([h, p, f]) => {
      if (cancelled) return
      setHoldings(h.status === 'fulfilled' ? h.value.data : null)
      setPendingOrders(p.status === 'fulfilled' ? p.value.data : null)
      setFilledOrders(f.status === 'fulfilled' ? f.value.data : null)
    })
    return () => { cancelled = true }
  }, [accountNo])
  const [segment01, setSegment01] = useState('kospi')
  const [segment02, setSegment02] = useState('kospi')
  const [segment03, setSegment03] = useState('kospi')
  const [segment04, setSegment04] = useState('kospi')
  const [segment05, setSegment05] = useState('kospi')
  const [segment06, setSegment06] = useState('kospi')

  return (

      <div aria-pressed={panelOpen} className={`flex flex-col sm:h-full sm:flex-row relative gap-4 sm:gap-0`}>
        <button
          type="button"
          onClick={() => setPanelOpen(v => !v)}
          aria-pressed={panelOpen}
          title={panelOpen ? '패널 숨기기' : '패널 보기'}
          className={`absolute hidden sm:block border border-gray-50 bg-slate-200 h-[48px] w-[24px] top-0.5 right-0.5 ${panelOpen ? 'rounded-l-lg' : 'rounded-r-lg rotate-180'}`}
        >
          <ArrowForwardIosSharp sx={{ fontSize: 20, color: 'text.disabled' }} />
        </button>

        <div 
          aria-hidden={!panelOpen}
          className={`@container p-0 sm:p-6 flex-1 flex flex-col gap-4 shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-in-out ${panelOpen ? 'w-full' : 'w-full'}`}
        >
          {/* <h1 className="text-2xl font-bold text-foreground">대시보드</h1> */}
          
          {/* 글로벌지수 */}
          <div className='w-full overflow-auto rounded-sm'>
            <div className='w-full flex gap-1 min-w-[800px]'>
              <Card title="KOSPI" subtitle='72,000,300' sx={{width: '100%'}} titleSx={{fontSize: '14px'}} subtitleSx={{fontSize: '20px'}}>
                <ul className='flex flex-col text-sm'>
                  <li className='flex-1 flex'><span>+1,000</span><span>(+1.2%)</span></li>
                </ul>              
              </Card>
              <Card title="KOSDAQ" subtitle='72,000,300' sx={{width: '100%'}} titleSx={{fontSize: '14px'}} subtitleSx={{fontSize: '20px'}}>
                <ul className='flex flex-col text-sm'>
                  <li className='flex-1 flex'><span>+1,000</span><span>(+1.2%)</span></li>
                </ul>              
              </Card>
              <Card title="NASDAQ" subtitle='72,000,300' sx={{width: '100%'}} titleSx={{fontSize: '14px'}} subtitleSx={{fontSize: '20px'}}>
                <ul className='flex flex-col text-sm'>
                  <li className='flex-1 flex'><span>+1,000</span><span>(+1.2%)</span></li>
                </ul>              
              </Card>
              <Card title="S&P 500" subtitle='72,000,300' sx={{width: '100%'}} titleSx={{fontSize: '14px'}} subtitleSx={{fontSize: '20px'}}>
                <ul className='flex flex-col text-sm'>
                  <li className='flex-1 flex'><span>+1,000</span><span>(+1.2%)</span></li>
                </ul>              
              </Card>
            </div>
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
                  sx={{height: 32}}
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
                  sx={{height: 32}}
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
                  sx={{height: 32}}
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
                  sx={{height: 32}}
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
                  sx={{height: 32}}
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
                  sx={{height: 32}}
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

            <div className='w-full overflow-auto rounded-sm'>
              <div className='flex gap-1 min-w-[800px]'>
                <Card sx={{width: '100%', minWidth: '200px'}}>
                  <ul className='flex flex-col text-sm gap-4'>
                    <li><span className='font-semibold'>삼성전자</span></li>
                    <li className='flex flex-col'>
                      <p className='font-semibold text-lg'>300,000</p>
                      <p><span>+1,000</span><span>(+1.2%)</span></p>
                    </li>
                  </ul>
                </Card>
                <Card sx={{width: '100%', minWidth: '200px'}}>
                  <ul className='flex flex-col text-sm gap-4'>
                    <li><span className='font-semibold'>삼성전자</span></li>
                    <li className='flex flex-col'>
                      <p className='font-semibold text-lg'>300,000</p>
                      <p><span>+1,000</span><span>(+1.2%)</span></p>
                    </li>
                  </ul>
                </Card>
                <Card sx={{width: '100%', minWidth: '200px'}}>
                  <ul className='flex flex-col text-sm gap-4'>
                    <li><span className='font-semibold'>삼성전자</span></li>
                    <li className='flex flex-col'>
                      <p className='font-semibold text-lg'>300,000</p>
                      <p><span>+1,000</span><span>(+1.2%)</span></p>
                    </li>
                  </ul>
                </Card>
                <Card sx={{width: '100%', minWidth: '200px'}}>
                  <ul className='flex flex-col text-sm gap-4'>
                    <li><span className='font-semibold'>삼성전자</span></li>
                    <li className='flex flex-col'>
                      <p className='font-semibold text-lg'>300,000</p>
                      <p><span>+1,000</span><span>(+1.2%)</span></p>
                    </li>
                  </ul>
                </Card>
                <Card sx={{width: '100%', minWidth: '200px'}}>
                  <ul className='flex flex-col text-sm gap-4'>
                    <li><span className='font-semibold'>삼성전자</span></li>
                    <li className='flex flex-col'>
                      <p className='font-semibold text-lg'>300,000</p>
                      <p><span>+1,000</span><span>(+1.2%)</span></p>
                    </li>
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* 사이드 패널 */}
        <div
          aria-hidden={!panelOpen}
          className={`shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-in-out border-gray-200 sm:bg-white ${panelOpen ? 'sm:border-l sm:w-[280px] 2xl:w-[380px] sm:opacity-100' : 'sm:w-0 sm:opacity-0'}`}
        >
          <div className="shrink-0 flex flex-col gap-4 rounded-xl bg-white border border-gray-200 sm:sm:rounded-none sm:border-none">
            <div className="sm:w-[280px] 2xl:w-[380px] shrink-0 flex-1 flex flex-col gap-4 p-4">
              <h2 className='text-lg font-semibold'>MY 계좌</h2>
              {/* 계좌 셀렉트 */}
              <AccountSelect fullWidth value={accountNo} onChange={setAccountNo} label="계좌 선택" placeholder="계좌번호를 선택하세요" />

              <Card
                title="총 평가금액"
                subtitle={holdings ? `${holdings.summary.totalEvalAmount.toLocaleString()}원` : '-'}
                titleSx={{fontSize: '14px'}} subtitleSx={{fontSize: '20px'}}
              >
                <ul className='flex flex-col text-sm'>
                  <li className={`flex-1 flex justify-between ${holdings ? pnlClass(holdings.summary.totalProfit) : ''}`}>
                    <span>{holdings ? `${signed(holdings.summary.totalProfit)}원` : '-'}</span>
                    <span>{holdings ? `(${signed(Number(holdings.summary.totalProfitRate.toFixed(2)))}%)` : ''}</span>
                  </li>
                </ul>
              </Card>

              <Card>
                <div className='flex justify-between mb-4 text-sm font-semibold'>
                  <span className='text-gray-400'>주문대기</span>
                  <span>{pendingOrders?.items.length ?? 0}건</span>
                </div>
                <ul className='flex flex-col text-sm'>
                  {(pendingOrders?.items ?? []).slice(0, 3).map(o => (
                    <li key={o.orderNo} className='flex-1 flex justify-between'>
                      <span>{o.name}</span>
                      <span>{(o.quantity - o.filledQuantity).toLocaleString()}주</span>
                    </li>
                  ))}
                  {(!pendingOrders || pendingOrders.items.length === 0) && (
                    <li className='text-gray-400'>주문대기 없음</li>
                  )}
                </ul>
                <Link href={'/order/history'}>
                  <button className='flex gap-1 items-center mt-2 ml-auto text-gray-500 hover:text-blue-500/90'>
                    <span className='text-sm'>더보기</span>
                    <FormatIndentIncreaseOutlined sx={{ fontSize: 15 }} />
                  </button>
                </Link>
              </Card>
              <Card>
                <div className='flex justify-between mb-4 text-sm font-semibold'>
                  <span className='text-gray-400'>체결완료</span>
                  <span>{filledOrders?.items.length ?? 0}건</span>
                </div>
                <ul className='flex flex-col text-sm'>
                  {(filledOrders?.items ?? []).slice(0, 3).map(o => (
                    <li key={o.orderNo} className='flex-1 flex justify-between'>
                      <span>{o.name}</span>
                      <span>{o.filledQuantity.toLocaleString()}주</span>
                    </li>
                  ))}
                  {(!filledOrders || filledOrders.items.length === 0) && (
                    <li className='text-gray-400'>체결완료 없음</li>
                  )}
                </ul>
                <Link href={'/order/history'}>
                  <button className='flex gap-1 items-center mt-2 ml-auto text-gray-500 hover:text-blue-500/90'>
                    <span className='text-sm'>더보기</span>
                    <FormatIndentIncreaseOutlined sx={{ fontSize: 15 }} />
                  </button>
                </Link>
              </Card>
              <Card>
                <div className='flex justify-between mb-4 text-sm font-semibold'>
                  <span className='text-gray-400'>보유주식</span>
                  <span>{holdings?.items.length ?? 0}종목</span>
                </div>
                <ul className='flex flex-col text-sm'>
                  {(holdings?.items ?? []).slice(0, 5).map(h => (
                    <li key={h.symbol} className='flex-1 flex justify-between'>
                      <span>{h.name}</span>
                      <span>{h.quantity.toLocaleString()}주</span>
                    </li>
                  ))}
                  {(!holdings || holdings.items.length === 0) && (
                    <li className='text-gray-400'>보유주식 없음</li>
                  )}
                </ul>
                <Link href={'/portfolio'}>
                  <button className='flex gap-1 items-center mt-2 ml-auto text-gray-500 hover:text-blue-500/90'>
                    <span className='text-sm'>더보기</span>
                    <FormatIndentIncreaseOutlined sx={{ fontSize: 15 }} />
                  </button>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </div>
  )
}
