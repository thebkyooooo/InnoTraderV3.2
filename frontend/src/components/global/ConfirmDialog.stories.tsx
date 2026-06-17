import type { Meta, StoryObj } from '@storybook/react'
import { ConfirmDialog } from './ConfirmDialog'

const meta = {
  title: 'Global/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
} satisfies Meta<typeof ConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    open: true,
    message: '삭제하시겠습니까?',
    onClose: () => {},
    onConfirm: () => {},
  },
}

export const Warning: Story = {
  args: {
    ...Default.args,
    severity: 'warning',
    title: '주의',
    message: '이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?',
  },
}

export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true,
  },
}
