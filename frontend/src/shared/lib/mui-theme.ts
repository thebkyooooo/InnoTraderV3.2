import { createTheme } from '@mui/material/styles'

// Tailwind 기본 브레이크포인트와 정렬 (MUI 기본 sm=600 → Tailwind sm=640 등)
const breakpoints = { values: { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280 } }

export const lightTheme = createTheme({
  breakpoints,
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
    // 오버레이류가 열릴 때 body 스크롤 잠금(overflow:hidden + padding-right) 비활성화 → 화면 흔들림 방지
    MuiModal:    { defaultProps: { disableScrollLock: true } },
    MuiDialog:   { defaultProps: { disableScrollLock: true } },
    MuiPopover:  { defaultProps: { disableScrollLock: true } },
    MuiMenu:     { defaultProps: { disableScrollLock: true } },
    MuiInputLabel: {
      styleOverrides: {
        // rest 상태 수직 정렬 보정. small은 보정 0(아래로 처짐 방지), 그 외 2px.
        // float(shrink) 상태는 MUI 기본 위치를 그대로 사용.
        root: ({ ownerState }) => ({
          top: ownerState.shrink ? undefined : ownerState.size === 'small' ? '0px' : '2px',
        }),
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
  breakpoints,
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
    // 오버레이류가 열릴 때 body 스크롤 잠금(overflow:hidden + padding-right) 비활성화 → 화면 흔들림 방지
    MuiModal:    { defaultProps: { disableScrollLock: true } },
    MuiDialog:   { defaultProps: { disableScrollLock: true } },
    MuiPopover:  { defaultProps: { disableScrollLock: true } },
    MuiMenu:     { defaultProps: { disableScrollLock: true } },
    MuiInputLabel: {
      styleOverrides: {
        // rest 상태 수직 정렬 보정. small은 보정 0(아래로 처짐 방지), 그 외 2px.
        // float(shrink) 상태는 MUI 기본 위치를 그대로 사용.
        root: ({ ownerState }) => ({
          top: ownerState.shrink ? undefined : ownerState.size === 'small' ? '0px' : '2px',
        }),
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
