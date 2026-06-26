import type { Meta, StoryObj } from '@storybook/react'
import { QuoteBoard } from './QuoteBoard'
import type { QuotePriceResponse } from '@/features/quote/api/quote-api'

const meta = {
  title: 'Quote/QuoteBoard',
  component: QuoteBoard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    onStockSelect: { action: '종목 선택' },
  },
} satisfies Meta<typeof QuoteBoard>

export default meta
type Story = StoryObj<typeof meta>

// 제어형(quote 직접 주입)으로 다양한 상태를 보여준다
const sampleQuote: QuotePriceResponse = {
  symbol:        '005930',
  name:          '삼성전자',
  market:        'KOSPI',
  price:         190000,
  prevDiff:      11606,
  change:        6.50,
  volume:        12245799,
  open:          202006,
  high:          213500,
  low:           178100,
  prevClose:     202006,
  upperLimit:    262607,
  lowerLimit:    141404,
  tradingAmount: 240000000, // 2.4조 (만원 단위)
}

/** 상승 종목 */
export const Rising: Story = {
  args: { symbol: '005930', quote: sampleQuote },
}

/** 하락 종목 */
export const Falling: Story = {
  args: {
    symbol: '000660',
    quote: { ...sampleQuote, symbol: '000660', name: 'SK하이닉스', price: 198500, prevDiff: -1596, change: -0.80 },
  },
}

/** 보합 종목 */
export const Flat: Story = {
  args: {
    symbol: '035420',
    quote: { ...sampleQuote, symbol: '035420', name: 'NAVER', market: 'KOSDAQ', price: 215000, prevDiff: 0, change: 0 },
  },
}

/** 시장구분 없음 */
export const NoMarket: Story = {
  args: { symbol: '005930', quote: { ...sampleQuote, market: '' } },
}

/** 종목검색 핸들러 연결 */
export const WithSearch: Story = {
  args: { symbol: '005930', quote: sampleQuote, onStockSelect: (stock) => alert(`선택: ${stock.name}`) },
}
