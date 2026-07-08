'use client'
import Link from 'next/link'
import { Card } from '@/components/ui/'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { ChevronRight } from '@mui/icons-material'
import type { RankingType } from '@/features/market/api/use-market'
import type { StockRanking } from '@/features/market/api/market-api'

export interface RankingSectionProps {
  title: string
  rankType: RankingType
  value: string
  onChange: (v: string) => void
  rows: StockRanking[]
  /** 보여줄 최대 행 수 (기본 7 — 대시보드 카드 높이 기준) */
  maxRows?: number
}

/** 랭킹 영역 공통 컴포넌트 (시가총액/거래량/상승/하락/갭상승/과열 동일 UI) — 대시보드/위젯 화면 공용. */
export function RankingSection({ title, rankType, value, onChange, rows, maxRows = 7 }: RankingSectionProps) {
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
            sx={{ height: 32, minWidth: '152px', marginLeft: 'auto' }}
          />
        </div>
        <ul className='flex flex-col gap-2 min-h-[327px]'>
          {rows.slice(0, maxRows).map((s, i) => {
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
        <Link href={`/market/ranking?type=${rankType}&market=${value}`} className='ml-auto'>
          <button className='flex items-center mt-2 text-sm text-gray-500 hover:text-blue-700'>
            더보기 <ChevronRight sx={{ fontSize: 18, marginRight: '-5px' }} />
          </button>
        </Link>
      </Card>
    </div>
  )
}
