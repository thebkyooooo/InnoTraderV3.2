import type { Meta, StoryObj } from '@storybook/react'
import { AlertDialog } from './AlertDialog'

const meta = {
  title: 'Global/AlertDialog',
  component: AlertDialog,
  tags: ['autodocs'],
} satisfies Meta<typeof AlertDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    open: true,
    title: '알림',
    message: '작업이 완료되었습니다.',
    onClose: () => {},
  },
}
