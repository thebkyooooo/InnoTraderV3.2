import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { StatusBadge } from './StatusBadge'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

type StatusType = 'active' | 'inactive' | 'pending' | 'error' | 'success' | 'warning'

const meta = {
  title: 'UI/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
} satisfies Meta<typeof StatusBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Active: Story = {
  args: { status: 'active' },
}

export const Inactive: Story = {
  args: { status: 'inactive' },
}

export const Pending: Story = {
  args: { status: 'pending' },
}

export const ErrorStatus: Story = {
  args: { status: 'error' },
}

export const AllStatuses: Story = {
  args: { status: 'active' },
  render: () => (
    <Stack spacing={2}>
      <Typography variant="subtitle2">Chip 형태</Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        {(['active', 'inactive', 'pending', 'error', 'success', 'warning'] as StatusType[]).map((s) => (
          <StatusBadge key={s} status={s} />
        ))}
      </Stack>
      <Typography variant="subtitle2">Dot 형태</Typography>
      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
        {(['active', 'inactive', 'pending', 'error', 'success', 'warning'] as StatusType[]).map((s) => (
          <StatusBadge key={s} status={s} dot />
        ))}
      </Stack>
    </Stack>
  ),
}
