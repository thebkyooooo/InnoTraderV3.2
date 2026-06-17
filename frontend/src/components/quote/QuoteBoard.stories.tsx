import type { Meta, StoryObj } from '@storybook/react'
import { QuoteBoard } from './QuoteBoard'

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

const base = {
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
  args: base,
}

/** 하락 종목 */
export const Falling: Story = {
  args: {
    ...base,
    name:     'SK하이닉스',
    symbol:   '000660',
    market:   'KOSPI',
    price:    198500,
    prevDiff: -1596,
    change:   -0.80,
  },
}

/** 보합 종목 */
export const Flat: Story = {
  args: {
    ...base,
    name:     'NAVER',
    symbol:   '035420',
    market:   'KOSDAQ',
    price:    215000,
    prevDiff: 0,
    change:   0,
  },
}

/** 시장구분 없음 */
export const NoMarket: Story = {
  args: { ...base, market: undefined },
}

/** 종목검색 핸들러 연결 */
export const WithSearch: Story = {
  args: { ...base, onStockSelect: (stock) => alert(`선택: ${stock.name}`) },
}
