import type { Meta, StoryObj } from '@storybook/react'
import { Select } from './Select'

const meta = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

const options = [
  { label: '삼성전자', value: '005930' },
  { label: 'SK하이닉스', value: '000660' },
  { label: 'NAVER', value: '035420' },
]

export const Default: Story = {
  args: { label: '종목 선택', value: '', onChange: () => {}, options, fullWidth: true },
}

export const WithError: Story = {
  args: { label: '종목 선택', value: '', onChange: () => {}, options, error: true, helperText: '종목을 선택해주세요', fullWidth: true },
}
