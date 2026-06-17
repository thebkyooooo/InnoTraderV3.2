import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './Input'

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { label: '이름', placeholder: '이름을 입력하세요' },
}

export const WithError: Story = {
  args: { label: '이메일', error: true, helperText: '올바른 이메일을 입력하세요', defaultValue: 'invalid-email' },
}

export const Password: Story = {
  args: { label: '비밀번호', type: 'password' },
}

export const Disabled: Story = {
  args: { label: '읽기 전용', disabled: true, defaultValue: '수정 불가' },
}
