'use client'
import { ThemeProvider } from '@mui/material/styles'
import { useMediaQuery } from '@mui/material'
import { useMemo } from 'react'
import { lightTheme, darkTheme } from './mui-theme'
import { EmotionCacheProvider } from './emotion-cache'

export function MuiProvider({ children }: { children: React.ReactNode }) {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const theme = useMemo(() => (prefersDark ? darkTheme : lightTheme), [prefersDark])

  return (
    <EmotionCacheProvider>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </EmotionCacheProvider>
  )
}
