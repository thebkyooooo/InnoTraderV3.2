import React from 'react'
import type { Meta, StoryObj, Decorator } from '@storybook/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Box, Typography, Paper } from '@mui/material'
import { AppLayout } from './AppLayout'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})

function QueryDecorator({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const withQuery: Decorator = (Story) => (
  <QueryDecorator>
    <Story />
  </QueryDecorator>
)

const SampleContent = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <Typography variant="h5" sx={{ fontWeight: 600 }}>
      대시보드
    </Typography>
    <Paper sx={{ p: 3 }}>
      <Typography variant="body1" color="text.secondary">
        샘플 콘텐츠 영역입니다. AppLayout이 Header, Sidebar, Footer를 포함한
        전체 레이아웃을 렌더링합니다.
      </Typography>
    </Paper>
    <Paper sx={{ p: 3 }}>
      <Typography variant="body2" color="text.secondary">
        데스크탑에서는 사이드바가 고정 표시되며, 모바일에서는 햄버거 버튼으로
        토글됩니다.
      </Typography>
    </Paper>
  </Box>
)

const meta: Meta<typeof AppLayout> = {
  title: 'Layout/AppLayout',
  component: AppLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withQuery],
}

export default meta
type Story = StoryObj<typeof AppLayout>

export const Default: Story = {
  args: {
    children: <SampleContent />,
  },
}

export const Mobile: Story = {
  args: {
    children: <SampleContent />,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile375' },
  },
}

export const Tablet: Story = {
  args: {
    children: <SampleContent />,
  },
  parameters: {
    viewport: { defaultViewport: 'tablet768' },
  },
}
