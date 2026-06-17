import type { Meta, StoryObj } from '@storybook/react'
import { Checkbox } from './Checkbox'

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { label: '동의합니다', checked: false, onChange: () => {} },
}

export const Checked: Story = {
  args: { label: '선택됨', checked: true, onChange: () => {} },
}

export const Indeterminate: Story = {
  args: { label: '일부 선택', checked: false, indeterminate: true, onChange: () => {} },
}
