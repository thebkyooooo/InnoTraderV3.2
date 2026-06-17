import React from 'react'
import type { Meta, StoryObj, Decorator } from '@storybook/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Header } from './Header'

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

const meta: Meta<typeof Header> = {
  title: 'Layout/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withQuery],
  args: {
    onMenuToggle: () => {},
  },
}

export default meta
type Story = StoryObj<typeof Header>

export const Default: Story = {}

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile375' },
  },
}
