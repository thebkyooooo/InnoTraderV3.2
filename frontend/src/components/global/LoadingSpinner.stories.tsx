import type { Meta, StoryObj } from '@storybook/react'
import { LoadingSpinner } from './LoadingSpinner'

const meta = {
  title: 'Global/LoadingSpinner',
  component: LoadingSpinner,
  tags: ['autodocs'],
} satisfies Meta<typeof LoadingSpinner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    size: 40,
  },
}

export const WithMessage: Story = {
  args: {
    size: 40,
    message: '불러오는 중...',
  },
}

export const FullScreen: Story = {
  args: {
    fullScreen: true,
    message: '처리 중입니다...',
  },
}
