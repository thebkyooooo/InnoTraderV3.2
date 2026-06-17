import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Chart } from './Chart'

const meta = {
  title: 'UI/Chart',
  component: Chart,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Chart>

export default meta
type Story = StoryObj<typeof meta>

const ohlcData = [
  { time: '2024-01-02', open: 71500, high: 73200, low: 71100, close: 72300 },
  { time: '2024-01-03', open: 72300, high: 74100, low: 72000, close: 73800 },
  { time: '2024-01-04', open: 73800, high: 74500, low: 72500, close: 72900 },
  { time: '2024-01-05', open: 72900, high: 73600, low: 71800, close: 71500 },
  { time: '2024-01-08', open: 71500, high: 72800, low: 70900, close: 72100 },
  { time: '2024-01-09', open: 72100, high: 73900, low: 71900, close: 73500 },
  { time: '2024-01-10', open: 73500, high: 75200, low: 73200, close: 74800 },
  { time: '2024-01-11', open: 74800, high: 75600, low: 74200, close: 74500 },
  { time: '2024-01-12', open: 74500, high: 76100, low: 74300, close: 75900 },
  { time: '2024-01-15', open: 75900, high: 76800, low: 75100, close: 75400 },
  { time: '2024-01-16', open: 75400, high: 76200, low: 74800, close: 76000 },
  { time: '2024-01-17', open: 76000, high: 77500, low: 75700, close: 77200 },
  { time: '2024-01-18', open: 77200, high: 77900, low: 76100, close: 76500 },
  { time: '2024-01-19', open: 76500, high: 77000, low: 75500, close: 75800 },
  { time: '2024-01-22', open: 75800, high: 76300, low: 74900, close: 75200 },
]

export const Candlestick: Story = {
  args: { data: ohlcData, height: 400, type: "area" },
}

export const Line: Story = {
  args: { data: ohlcData, height: 300, type: 'line' },
}

export const Area: Story = {
  args: { data: ohlcData, height: 300, type: 'area' },
}
