import type { Meta, StoryObj } from '@storybook/react'
import { Radio } from './Radio'

const meta = {
  title: 'UI/Radio',
  component: Radio,
  tags: ['autodocs'],
} satisfies Meta<typeof Radio>

export default meta
type Story = StoryObj<typeof meta>

const options = [
  { label: '옵션 A', value: 'a' },
  { label: '옵션 B', value: 'b' },
  { label: '옵션 C (비활성)', value: 'c', disabled: true },
]

export const Default: Story = {
  args: { label: '선택', value: 'a', onChange: () => {}, options },
}

export const Horizontal: Story = {
  args: { label: '수평 배치', value: 'b', onChange: () => {}, options, row: true },
}
