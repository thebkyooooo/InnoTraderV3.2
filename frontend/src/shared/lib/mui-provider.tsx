'use client'
import { ThemeProvider } from '@mui/material/styles'
import { lightTheme } from './mui-theme'
import { EmotionCacheProvider } from './emotion-cache'

export function MuiProvider({ children }: { children: React.ReactNode }) {
  // 라이트 모드 고정 (시스템 다크 무시)
  return (
    <EmotionCacheProvider>
      <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
    </EmotionCacheProvider>
  )
}
