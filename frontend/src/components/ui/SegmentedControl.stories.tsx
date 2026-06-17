import type { Meta, StoryObj } from '@storybook/react'
import { SegmentedControl } from './SegmentedControl'

const meta = {
  title: 'UI/SegmentedControl',
  component: SegmentedControl,
  tags: ['autodocs'],
} satisfies Meta<typeof SegmentedControl>

export default meta
type Story = StoryObj<typeof meta>

const options = [
  { label: '1일', value: '1d' },
  { label: '1주', value: '1w' },
  { label: '1개월', value: '1m' },
  { label: '1년', value: '1y' },
]

export const Default: Story = {
  args: { value: '1d', onChange: () => {}, options },
}

export const FullWidth: Story = {
  args: { value: '1w', onChange: () => {}, options, fullWidth: true },
}
