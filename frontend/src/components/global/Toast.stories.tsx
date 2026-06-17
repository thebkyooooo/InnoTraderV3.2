import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { ToastProvider, useToast } from './Toast'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'

const meta = {
  title: 'Global/Toast',
  component: ToastProvider,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
  args: {
    children: null,
  },
} satisfies Meta<typeof ToastProvider>

export default meta
type Story = StoryObj<typeof meta>

function ToastDemo({ severity }: { severity: 'success' | 'error' | 'warning' | 'info' }) {
  const toast = useToast()
  const messages = {
    success: '저장되었습니다.',
    error: '오류가 발생했습니다.',
    warning: '주의가 필요합니다.',
    info: '정보를 확인하세요.',
  }
  return (
    <Button variant="contained" onClick={() => toast[severity](messages[severity])}>
      {severity} 토스트 표시
    </Button>
  )
}

export const Success: Story = {
  args: { children: null },
  render: () => <ToastDemo severity="success" />,
}

export const Error: Story = {
  args: { children: null },
  render: () => <ToastDemo severity="error" />,
}

export const Warning: Story = {
  args: { children: null },
  render: () => <ToastDemo severity="warning" />,
}

export const Info: Story = {
  args: { children: null },
  render: () => <ToastDemo severity="info" />,
}

export const AllTypes: Story = {
  args: { children: null },
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const toast = useToast()
    return (
      <Stack direction="row" spacing={1}>
        <Button onClick={() => toast.success('성공!')}>Success</Button>
        <Button onClick={() => toast.error('오류!')}>Error</Button>
        <Button onClick={() => toast.warning('경고!')}>Warning</Button>
        <Button onClick={() => toast.info('정보!')}>Info</Button>
      </Stack>
    )
  },
}
