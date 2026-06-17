import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Section } from './Section'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

const meta = {
  title: 'UI/Section',
  component: Section,
  tags: ['autodocs'],
} satisfies Meta<typeof Section>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: '섹션 제목',
    description: '섹션에 대한 설명입니다.',
    children: <Typography>섹션 내용이 여기에 표시됩니다.</Typography>,
  },
}

export const WithActions: Story = {
  args: {
    title: '포트폴리오',
    description: '보유 종목 현황',
    children: <Typography>포트폴리오 내용</Typography>,
    actions: <Button variant="contained" size="small">추가</Button>,
  },
}

export const NoTitle: Story = {
  args: {
    children: <Typography>제목 없는 섹션</Typography>,
  },
}
