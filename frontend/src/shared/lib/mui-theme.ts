import { createTheme } from '@mui/material/styles'

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563eb', light: '#3b82f6', dark: '#1d4ed8' },
    secondary: { main: '#6366f1' },
    success: { main: '#16a34a' },
    error: { main: '#dc2626' },
    background: { default: '#f8fafc', paper: '#ffffff' },
  },
  typography: { fontFamily: 'var(--font-inter), system-ui, sans-serif' },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiInputLabel: {
      styleOverrides: {
        // 키인(float) 시 라벨 위치 보정: top 0 → 4px
        root: { top: '4px' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: '1px solid', borderColor: 'rgba(0,0,0,0.08)' },
      },
    },
  },
})

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#3b82f6', light: '#60a5fa', dark: '#2563eb' },
    secondary: { main: '#818cf8' },
    success: { main: '#22c55e' },
    error: { main: '#ef4444' },
    background: { default: '#0f172a', paper: '#1e293b' },
  },
  typography: { fontFamily: 'var(--font-inter), system-ui, sans-serif' },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiInputLabel: {
      styleOverrides: {
        // 키인(float) 시 라벨 위치 보정: top 0 → 4px
        root: { top: '4px' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: '1px solid', borderColor: 'rgba(255,255,255,0.08)' },
      },
    },
  },
})
