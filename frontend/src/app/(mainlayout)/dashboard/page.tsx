'use client'
import Link from 'next/link'
import React, { useState, useMemo } from 'react'
import { AccountSelect } from '@/components/account'
import { Card, Button } from '@/components/ui/'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { DragScroll } from '@/components/ui/DragScroll'
import { ArrowForwardIosSharp, FormatIndentIncreaseOutlined, Cached } from '@mui/icons-material';
import { useHoldings } from '@/features/holding/api/use-holding'
import { useOrderHistory } from '@/features/order/api/use-order'
import {
  useMarketIndex,
  useExchangeRates,
  useMarketCapRanking,
  useVolumeRanking,
  useAdvancing,
  useDeclining,
  useGapUp,
  useOverheated,
  useTrending,
} from '@/features/market/api/use-market'
import { useStockPricesWS, useIndexWS, useExchangeWS } from '@/features/quote/api/use-quote-ws'
import type { StockRanking, MarketType } from '@/features/market/api/market-api'

// segment 값('all'|'kospi'|'kosdaq') → 백엔드 MarketType('ALL'|'KOSPI'|'KOSDAQ') 변환
const toMarketType = (segment: string): MarketType =>
  segment === 'all' ? 'ALL' : segment === 'kosdaq' ? 'KOSDAQ' : 'KOSPI'

// 손익 부호 색상 (이익=빨강, 손실=파랑)
const pnlClass = (v: number) => (v > 0 ? 'text-red-500' : v < 0 ? 'text-blue-500' : 'text-gray-500')
const signed = (v: number) => `${v > 0 ? '+' : ''}${v.toLocaleString()}`
// 지수/환율용 — 소수점 2자리 고정 (1000.00, 1000.10 등)
const fmt2 = (v: number) => v.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const signed2 = (v: number) => `${v > 0 ? '+' : ''}${fmt2(v)}`
// 건수/종목수 라벨: 0 또는 미로딩 시 '-' 표시
const countLabel = (n: number | undefined, unit: string) => (n ? `${n}${unit}` : '-')
// 오늘 날짜 (YYYY-MM-DD) — 주문일자(orderDate) 당일 비교용
const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── 랭킹 영역 공통 컴포넌트 (시가총액/거래량/상승/하락/갭상승/과열 동일 UI) ──────
interface RankingSectionProps {
  title: string
  value: string
  onChange: (v: string) => void
  rows: StockRanking[]
}

function RankingSection({ title, value, onChange, rows }: RankingSectionProps) {
  return (
    <div className='@container w-full flex flex-col gap-2'>
      

      <Card>
        <div className='w-full flex flex-col @[280px]:flex-row gap-2 @[300px]:justify-between mt-1 mb-4'>
          <div className='text-sm text-gray-500 font-semibold border-b-2 border-gray-400 pb-3 mr-auto'>{title}</div>
          <SegmentedControl
            value={value}
            onChange={onChange}
            options={[
              { label: '전체', value: 'all' },
              { label: '코스피', value: 'kospi' },
              { label: '코스닥', value: 'kosdaq' },
            ]}
            size="small"
            sx={{height: 32, minWidth: '152px', marginLeft: 'auto'}}
          />
        </div>
        <ul className='flex flex-col gap-2 min-h-[327px]'>
          {rows.slice(0, 7).map((s, i) => {
            const up = s.change >= 0
            const color = up ? 'text-red-500' : 'text-blue-500'
            const sign = up ? '+' : '-'
            return (
              <li key={`${s.symbol}-${i}`} className='flex flex-col @[220px]:flex-row justify-between text-sm font-semibold'>
                <div>{s.name}</div>
                <div className='flex flex-col items-end tabular-nums'>
                  <p>{s.price.toLocaleString()}</p>
                  <p className={`text-[12px] font-normal ${color} whitespace-nowrap`}>
                    <span className="mr-0.5">{sign}{Math.abs(s.prevDiff).toLocaleString()}</span>
                    <span>({sign}{Math.abs(s.change)}%)</span>
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}

export default function DashboardPage() {
  const [accountNo, setAccountNo] = useState('')
  const [panelOpen, setPanelOpen] = useState(true)

  // ── MY 계좌 사이드 패널 데이터 ────────────────────────────────────────────────
  // Holdings/OrderHistory 컴포넌트와 같은 queryKey라 동시/중복 요청은 dedupe된다.
  const { data: holdings = null, refetch: refetchHoldings } = useHoldings(accountNo)   // 평가금액 + 보유주식
  // 주문대기/체결완료는 당일만 백엔드에서 조회한다 (startDate=endDate=오늘).
  const today = todayStr()
  const { data: pendingOrders = null, refetch: refetchPending } = useOrderHistory({ accountNo, fill: 'UNFILLED', startDate: today, endDate: today })  // 주문대기(미체결)
  const { data: filledOrders = null, refetch: refetchFilled } = useOrderHistory({ accountNo, fill: 'FILLED', startDate: today, endDate: today })      // 체결완료

  const pendingToday = pendingOrders?.items ?? []
  const filledToday = filledOrders?.items ?? []

  // 리프레시 버튼 — 총평가금액/보유주식(홀딩스), 주문대기, 체결완료를 한 번에 재조회
  const refreshMyAccount = () => {
    refetchHoldings()
    refetchPending()
    refetchFilled()
  }

  // ── 시장 정보(글로벌지수/환율) — 공개 API + 실시간 WS(REST 스냅샷과 이어짐) ────────
  const { data: indexSnapshot = [] } = useMarketIndex()
  const { data: exchangeSnapshot = [] } = useExchangeRates()
  const liveIndexes = useIndexWS()
  const liveExchanges = useExchangeWS()
  const indexes = liveIndexes ?? indexSnapshot
  const exchanges = liveExchanges ?? exchangeSnapshot

  // ── 랭킹 영역 ↔ 훅 매핑 (시장 구분 segment 연동) ───────────────────────────────
  const [segment01, setSegment01] = useState('all')
  const [segment02, setSegment02] = useState('all')
  const [segment03, setSegment03] = useState('all')
  const [segment04, setSegment04] = useState('all')
  const [segment05, setSegment05] = useState('all')
  const [segment06, setSegment06] = useState('all')
  const { data: marketCapRows = [] } = useMarketCapRanking(toMarketType(segment01))
  const { data: volumeRows = [] } = useVolumeRanking(toMarketType(segment02))
  const { data: advancingRows = [] } = useAdvancing(toMarketType(segment03))
  const { data: decliningRows = [] } = useDeclining(toMarketType(segment04))
  const { data: gapUpRows = [] } = useGapUp(toMarketType(segment05))
  const { data: overheatedRows = [] } = useOverheated(toMarketType(segment06))
  const { data: trendingRows = [] } = useTrending()

  // 실시간 현재가 병합 — 랭킹 7개 영역의 심볼을 모아 WS 구독은 한 번만 유지하고,
  // 섹션별로는 값만 실시간으로 갱신한다 (순위/시가총액 등 스냅샷 필드는 그대로 유지).
  const rankingSymbols = useMemo(() => {
    const set = new Set<string>()
    for (const rows of [marketCapRows, volumeRows, advancingRows, decliningRows, gapUpRows, overheatedRows, trendingRows]) {
      for (const r of rows) set.add(r.symbol)
    }
    return Array.from(set)
  }, [marketCapRows, volumeRows, advancingRows, decliningRows, gapUpRows, overheatedRows, trendingRows])
  const liveRankingQuotes = useStockPricesWS(rankingSymbols)
  const withLive = (rows: StockRanking[]) => rows.map((r) => {
    const live = liveRankingQuotes[r.symbol]
    if (!live) return r
    return { ...r, price: live.price, prevDiff: live.prevDiff, change: live.change, volume: live.volume, tradingAmount: live.tradingAmount }
  })

  return (

      <div aria-pressed={panelOpen} className={`flex flex-col sm:h-full sm:flex-row relative gap-0`}>
        <button
          type="button"
          onClick={() => setPanelOpen(v => !v)}
          aria-pressed={panelOpen}
          title={panelOpen ? '패널 숨기기' : '패널 보기'}
          className={`absolute hidden sm:block border border-gray-50 bg-slate-200 h-[40px] w-[24px] top-0.5 right-0.5 transition-transform duration-300 ease-in-out ${panelOpen ? 'rounded-l-2xl' : 'rounded-r-2xl rotate-180'}`}
        >
          <ArrowForwardIosSharp sx={{ fontSize: 20, color: 'text.disabled' }} />
        </button>

        <div 
          aria-hidden={!panelOpen}
          className={`@container p-4 sm:p-6 flex-1 flex flex-col gap-4 shrink-0 transition-[opacity] duration-300 ease-in-out ${panelOpen ? 'w-full' : 'w-full'}`}
        >
          {/* <h1 className="text-2xl font-bold text-foreground">대시보드</h1> */}
          
          {/* 글로벌지수 */}
          <DragScroll className='flex w-full rounded-lg min-h-[129px]'>
            <div className='flex gap-2 w-full'>
              {indexes.map(idx => (
                <Card key={idx.code} title={idx.name} subtitle={fmt2(idx.price)} sx={{background: '#eaecf0 !important', border: 'none', width: '100%', minWidth: '200px', pr: 7}} titleSx={{fontSize: '14px'}} subtitleSx={{fontSize: '24px', fontWeight: 500, fontVariantNumeric: 'tabular-nums'}}>
                  <ul className='flex flex-col text-sm tabular-nums'>
                    <li className={`flex-1 flex gap-1 ${pnlClass(idx.prevDiff)}`}>
                      <span>{signed2(idx.prevDiff)}</span>
                      <span>({signed2(idx.change)}%)</span>
                    </li>
                  </ul>
                </Card>
              ))}
            </div>
          </DragScroll>

          <div className='w-full grid grid-cols-1 @[580px]:grid-cols-2 @[1024px]:grid-cols-3 gap-4'>
            <RankingSection title='시가총액' value={segment01} onChange={setSegment01} rows={withLive(marketCapRows)} />
            <RankingSection title='거래량' value={segment02} onChange={setSegment02} rows={withLive(volumeRows)} />
            <RankingSection title='상승' value={segment03} onChange={setSegment03} rows={withLive(advancingRows)} />
            <RankingSection title='하락' value={segment04} onChange={setSegment04} rows={withLive(decliningRows)} />
            <RankingSection title='갭상승' value={segment05} onChange={setSegment05} rows={withLive(gapUpRows)} />
            <RankingSection title='투자심리과열' value={segment06} onChange={setSegment06} rows={withLive(overheatedRows)} />
          </div>

          {/* 인기검색종목 */}
          <div className='w-full flex flex-col gap-2'>
            <div className='w-full flex gap-2 justify-between items-center'>
              <h2 className='text-sm font-semibold'>인기검색종목</h2>
            </div>

            <DragScroll className='flex w-full rounded-lg min-h-[118px]'>
              <div className='flex gap-2 w-full'>
                {withLive(trendingRows).map((s, i) => {
                  const up = s.change >= 0
                  const color = up ? 'text-red-500' : 'text-blue-500'
                  const sign = up ? '+' : '-'
                  return (
                    <Card key={`${s.symbol}-${i}`} sx={{width: '100%', minWidth: '200px', background: '#eaecf0 !important', border: 'none' }}>
                      <ul className='flex flex-col text-sm gap-4'>
                        <li><span className='font-semibold'>{s.name}</span></li>
                        <li className='flex flex-col tabular-nums'>
                          <p className='font-semibold text-lg'>{s.price.toLocaleString()}</p>
                          <p className={color}>
                            <span>{sign}{Math.abs(s.prevDiff).toLocaleString()}</span>
                            <span> ({sign}{Math.abs(s.change)}%)</span>
                          </p>
                        </li>
                      </ul>
                    </Card>
                  )
                })}
              </div>
            </DragScroll>
          </div>

          {/* 환율 */}
          <div className='w-full flex flex-col gap-2'>
            <div className='w-full flex gap-2 justify-between items-center'>
              <h2 className='text-sm font-semibold'>주요 환율</h2>
            </div>

            <DragScroll className='flex w-full rounded-lg border-l border-r border-gray-200'>
              <div className='flex gap-2 w-full'>
                {exchanges.map(ex => (
                  <div key={ex.pair} className='flex-1 flex gap-2 py-2 px-3 items-center rounded-md border border-gray-200 bg-slate-700'>
                    <span className='text-sm text-gray-300/80 font-semibold whitespace-nowrap'>{ex.pair}</span>
                    <span className={`w-32 justify-end flex-1 inline-flex items-center gap-1 font-semibold text-xs whitespace-nowrap tabular-nums ${pnlClass(ex.prevDiff)}`}>
                      <span>{fmt2(ex.rate)}원</span>
                      <span>({signed2(ex.change)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </DragScroll>
          </div>
        </div>

        {/* 사이드 패널 */}
        <div
          aria-hidden={!panelOpen}
          className={`shrink-0 p-4 pt-0 sm:p-0 overflow-hidden transition-[width,opacity] duration-300 ease-in-out border-gray-200 sm:bg-white ${panelOpen ? 'sm:border-l sm:w-[280px] h-2xl-2xl:w-[480px] sm:opacity-100' : 'sm:w-0 sm:opacity-0'}`}
        >
          <div className="shrink-0 flex flex-col gap-4 rounded-xl bg-white border border-gray-200 sm:sm:rounded-none sm:border-none">
            <div className="sm:w-[280px] h-2xl-2xl:w-[480px] shrink-0 flex-1 flex flex-col gap-4 p-4">
              <h2 className='text-lg font-semibold'>MY 계좌</h2>
              {/* 계좌 셀렉트 */}
              <div className='flex gap-1 items-center'>
                <AccountSelect fullWidth value={accountNo} onChange={setAccountNo} label="계좌 선택" placeholder="계좌번호를 선택하세요" />
                <button type='button' onClick={refreshMyAccount} title='새로고침' className='h-10 w-10 border border-gray-300 rounded-md text-gray-400 hover:text-blue-500/90'>
                  <Cached sx={{ fontSize: '25px' }} />
                </button>
              </div>

              <Card
                title="총 평가금액"
                subtitle={holdings ? `${holdings.summary.totalEvalAmount.toLocaleString()}원` : '-'}
                titleSx={{fontSize: '14px'}} subtitleSx={{fontSize: '20px', fontVariantNumeric: 'tabular-nums'}}
              >
                {(pendingOrders?.items?.length ?? 0) > 0 ? (
                  <ul className='flex flex-col text-sm tabular-nums'>
                    <li className={`flex-1 flex justify-between ${holdings ? pnlClass(holdings.summary.totalProfit) : ''}`}>
                      <span>{holdings ? `${signed(holdings.summary.totalProfit)}원` : '-'}</span>
                      <span>{holdings ? `(${signed(Number(holdings.summary.totalProfitRate.toFixed(2)))}%)` : ''}</span>
                    </li>
                  </ul>
                ) : (
                  <div className='flex flex-col text-sm'>
                    <span className='text-gray-400 text-center'>평가 금액이 없습니다.</span>
                  </div>
                )}
              </Card>

              <Card>
                <div className='flex justify-between mb-4 text-sm font-semibold tabular-nums'>
                  <span className='text-gray-400'>주문대기</span>
                  <span>{countLabel(pendingToday.length, '건')}</span>
                </div>
                <div className='flex flex-col text-sm tabular-nums'>
                  {pendingToday.slice(0, 3).map(o => (
                    <div key={o.orderNo} className='flex-1 flex justify-between'>
                      <span>{o.name}</span>
                      <span>{(o.quantity - o.filledQuantity).toLocaleString()}주</span>
                    </div>
                  ))}
                  {pendingToday.length > 0 ? (
                    <Link href={'/order/history'} className='ml-auto'>
                      <button className='flex gap-1 items-center mt-2 text-gray-500 hover:text-blue-500/90'>
                        <span className='text-sm'>더보기</span>
                        <FormatIndentIncreaseOutlined sx={{ fontSize: 15 }} />
                      </button>
                    </Link>
                  ) : (
                    <div className='flex flex-col gap-2'>
                      <span className='text-gray-400 text-center'>미체결 주문이 없습니다.</span>
                      <Link className='self-center' href={'/order/order'}>
                        <Button
                          variant="outlined"
                          size='small'
                        >
                          주문하기
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <div className='flex justify-between mb-4 text-sm font-semibold tabular-nums'>
                  <span className='text-gray-400'>체결완료</span>
                  <span>{countLabel(filledToday.length, '건')}</span>
                </div>
                <div className='flex flex-col text-sm tabular-nums'>
                  {filledToday.slice(0, 3).map(o => (
                    <div key={o.orderNo} className='flex-1 flex justify-between'>
                      <span>{o.name}</span>
                      <span>{o.filledQuantity.toLocaleString()}주</span>
                    </div>
                  ))}
                  {filledToday.length > 0 ? (
                    <Link href={'/order/history'} className='ml-auto'>
                      <button className='flex gap-1 items-center mt-2 text-gray-500 hover:text-blue-500/90'>
                        <span className='text-sm'>더보기</span>
                        <FormatIndentIncreaseOutlined sx={{ fontSize: 15 }} />
                      </button>
                    </Link>
                  ) : (
                    <div className='flex flex-col gap-2'>
                      <span className='text-gray-400 text-center'>체결 주문이 없습니다.</span>
                      <Link className='self-center' href={'/order/order'}>
                        <Button
                          variant="outlined"
                          size='small'
                        >
                          주문하기
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </Card>
              <Card>
                <div className='flex justify-between mb-4 text-sm font-semibold tabular-nums'>
                  <span className='text-gray-400'>보유주식</span>
                  <span>{countLabel(holdings?.items?.length ?? 0, '종목')}</span>
                </div>
                <div className='flex flex-col text-sm tabular-nums'>
                  {(holdings?.items ?? []).slice(0, 5).map(h => (
                    <div key={h.symbol} className='flex-1 flex justify-between'>
                      <span>{h.name}</span>
                      <span>{h.quantity.toLocaleString()}주</span>
                    </div>
                  ))}
                  {(holdings?.items?.length ?? 0) > 0 ? (
                    <Link href={'/portfolio'} className='ml-auto'>
                      <Button className='flex gap-1 items-center mt-2 text-gray-500 hover:text-blue-500/90'>
                        <span className='text-sm'>더보기</span>
                        <FormatIndentIncreaseOutlined sx={{ fontSize: 15 }} />
                      </Button>
                    </Link>
                  ) : (
                    <div className='flex flex-col gap-2'>
                      <span className='text-gray-400 text-center'>보유 종목이 없습니다.</span>
                      <Link className='self-center' href={'/order/order'}>
                        <Button
                          variant="outlined"
                          size='small'
                        >
                          주문하기
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
  )
}
