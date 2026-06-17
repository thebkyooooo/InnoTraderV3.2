import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Contained: Story = {
  args: { variant: 'contained', children: '확인' },
}

export const Outlined: Story = {
  args: { variant: 'outlined', children: '취소' },
}

export const Text: Story = {
  args: { variant: 'text', children: '더보기' },
}

export const Loading: Story = {
  args: { variant: 'contained', children: '저장', loading: true },
}

export const Disabled: Story = {
  args: { variant: 'contained', children: '비활성', disabled: true },
}
