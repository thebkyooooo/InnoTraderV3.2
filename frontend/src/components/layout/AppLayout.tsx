'use client'
import React, { useState, useEffect } from 'react'
import { Box, useTheme, useMediaQuery } from '@mui/material'
import type { SxProps, Theme } from '@mui/material'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'
import { useCurrentUser } from '@/features/auth/api/use-auth'
import { useAuthStore } from '@/store/auth-store'
import { refreshAccessToken } from '@/shared/api/axios-instance'

const DRAWER_WIDTH = 240

interface AppLayoutProps {
  children: React.ReactNode
  mainSx?: SxProps<Theme>
}

export function AppLayout({ children, mainSx }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))

  const { data: currentUser } = useCurrentUser()
  const setUser = useAuthStore((s) => s.setUser)

  // 새로고침 시 session 쿠키가 있으면 proactive refresh → isAuthenticated 복원.
  // 공유 single-flight(refreshAccessToken)를 사용해 인터셉터 refresh와 중복 호출되지 않게 한다.
  useEffect(() => {
    const hasSession = document.cookie.includes('auth_session=1')
    if (hasSession) {
      refreshAccessToken().catch(() => {
        document.cookie = 'auth_session=; path=/; max-age=0; SameSite=Lax'
      })
    }
  }, [])

  useEffect(() => {
    if (currentUser) {
      setUser({
        userId: currentUser.userId,
        email: currentUser.email,
        role: currentUser.role,
        status: currentUser.status,
      })
    }
  }, [currentUser, setUser])

  const handleMenuToggle = () => setSidebarOpen((prev) => !prev)
  const handleSidebarClose = () => setSidebarOpen(false)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', '@supports (min-height: 100dvh)': { minHeight: '100dvh' }, bgcolor: 'background.default' }}>
      {/* 사이드바 */}
      <Sidebar open={isDesktop || sidebarOpen} onClose={handleSidebarClose} />

      {/* 메인 영역 */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          marginLeft: { xs: 0, md: `${DRAWER_WIDTH + 5}px` },
        }}
      >
        {/* 헤더 */}
        <Header onMenuToggle={handleMenuToggle} />
        {/* fixed 헤더 높이만큼 밀어내는 spacer — Header의 Toolbar minHeight(54px) + borderBottom(1px)과 반드시 일치시켜야 함 */}
        <Box sx={{ flexShrink: 0, minHeight: '56px' }} />

        {/* 콘텐츠 */}
        <Box
          component="main"
          sx={[
            {
              flex: 1,
              p: { xs: 2, sm: 3 },
              overflow: 'auto',
              borderRight: '1px solid',
              borderLeft: '1px solid',
              borderColor: 'divider',
              containerType: 'inline-size',
            },
            ...(Array.isArray(mainSx) ? mainSx : mainSx ? [mainSx] : []),
          ]}
        >
          {children}
        </Box>

        {/* 푸터 */}
        <Footer />
      </Box>
    </Box>
  )
}
