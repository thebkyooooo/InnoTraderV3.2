import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Card } from './Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import MoreVertIcon from '@mui/icons-material/MoreVert'

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: <Typography>카드 내용입니다.</Typography>,
  },
}

export const WithHeader: Story = {
  args: {
    title: '삼성전자',
    subtitle: '005930',
    headerAction: (
      <IconButton size="small">
        <MoreVertIcon />
      </IconButton>
    ),
    children: <Typography>₩72,300 (+1.2%)</Typography>,
    actions: (
      <>
        <Button size="small">매수</Button>
        <Button size="small" color="error">매도</Button>
      </>
    ),
  },
}
