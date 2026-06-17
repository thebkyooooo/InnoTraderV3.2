import type { Meta, StoryObj } from '@storybook/react'
import { Sidebar } from './Sidebar'

const meta: Meta<typeof Sidebar> = {
  title: 'Layout/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    open: true,
    onClose: () => {},
  },
}

export default meta
type Story = StoryObj<typeof Sidebar>

export const Default: Story = {
  args: {
    open: true,
  },
}

export const Mobile: Story = {
  args: {
    open: true,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile375' },
  },
}

export const Closed: Story = {
  args: {
    open: false,
  },
}
