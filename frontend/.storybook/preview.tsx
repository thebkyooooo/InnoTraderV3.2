import type { Preview } from '@storybook/react'
import { ThemeProvider } from '@mui/material/styles'
import React from 'react'
import { lightTheme } from '../src/shared/lib/mui-theme'
import '../src/app/globals.css'

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider theme={lightTheme}>
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    viewport: {
      viewports: {
        mobile375: { name: 'Mobile 375', styles: { width: '375px', height: '812px' } },
        tablet768: { name: 'Tablet 768', styles: { width: '768px', height: '1024px' } },
        desktop1280: { name: 'Desktop 1280', styles: { width: '1280px', height: '900px' } },
      },
    },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/ } },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f8fafc' },
        { name: 'dark', value: '#0f172a' },
      ],
    },
  },
}

export default preview
