'use client'
import { Card } from '@/components/ui'

export default function MarketTrendPage() {
  return (
    <div className="flex flex-col gap-4 w-full h-full">
      
      <div className="flex gap-2">
        <Card title="개인" sx={{width: '100%', minWidth: '200px', pr: 1}} titleSx={{fontSize: '14px', mb: '-16px'}}>
        <span className='text-lg'>+81,898억</span>
        </Card>
        <Card title="외국인" sx={{width: '100%', minWidth: '200px', pr: 1}} titleSx={{fontSize: '14px', mb: '-16px'}}>
          <span className='text-lg'>+81,898억</span>
        </Card>
        <Card title="기관" sx={{width: '100%', minWidth: '200px', pr: 1}} titleSx={{fontSize: '14px', mb: '-16px'}}>
          <span className='text-lg'>+81,898억</span>
        </Card>
      </div>

      {/* 시장 투자자동향 그리드 */}
      <div className="flex-1">
        {/* TODO: 그리드 컴포넌트 */}
      </div>

    </div>
  )
}
