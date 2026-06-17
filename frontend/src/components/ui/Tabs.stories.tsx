import type { Meta, StoryObj } from '@storybook/react'
import { Tabs } from './Tabs'
import HomeIcon from '@mui/icons-material/Home'
import React from 'react'

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 'overview',
    onChange: () => {},
    tabs: [
      { value: 'overview', label: '개요' },
      { value: 'holdings', label: '보유종목' },
      { value: 'history', label: '거래내역' },
      { value: 'disabled', label: '비활성', disabled: true },
    ],
  },
}

export const WithIcons: Story = {
  args: {
    value: 'home',
    onChange: () => {},
    tabs: [
      { value: 'home', label: '홈', icon: <HomeIcon fontSize="small" /> },
      { value: 'portfolio', label: '포트폴리오' },
    ],
  },
}
