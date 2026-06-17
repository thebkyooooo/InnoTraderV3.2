import type { Meta, StoryObj } from '@storybook/react'
import { ToggleSwitch } from './ToggleSwitch'

const meta = {
  title: 'UI/ToggleSwitch',
  component: ToggleSwitch,
  tags: ['autodocs'],
} satisfies Meta<typeof ToggleSwitch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { checked: false, onChange: () => {} },
}

export const WithLabel: Story = {
  args: { label: '알림 활성화', checked: true, onChange: () => {} },
}

export const LabelStart: Story = {
  args: { label: '다크 모드', checked: false, onChange: () => {}, labelPlacement: 'start' },
}
