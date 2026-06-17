import type { Meta, StoryObj } from '@storybook/react'
import { DatePicker } from './DatePicker'

const meta = {
  title: 'UI/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
} satisfies Meta<typeof DatePicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: '날짜 선택',
    value: null,
    onChange: () => {},
  },
}

export const WithValue: Story = {
  args: {
    label: '시작일',
    value: new Date('2026-01-01'),
    onChange: () => {},
  },
}

export const WithError: Story = {
  args: {
    label: '날짜',
    value: null,
    onChange: () => {},
    error: true,
    helperText: '날짜를 선택해주세요',
  },
}
