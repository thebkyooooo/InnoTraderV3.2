import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Modal } from './Modal'
import Button from '@mui/material/Button'

const meta = {
  title: 'Global/Modal',
  component: Modal,
  tags: ['autodocs'],
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    open: true,
    title: '모달 제목',
    children: '모달 내용입니다.',
    onClose: () => {},
  },
}

export const WithActions: Story = {
  args: {
    open: true,
    title: '확인 모달',
    children: '이 작업을 수행하시겠습니까?',
    onClose: () => {},
    actions: (
      <>
        <Button variant="outlined">취소</Button>
        <Button variant="contained">확인</Button>
      </>
    ),
  },
}
