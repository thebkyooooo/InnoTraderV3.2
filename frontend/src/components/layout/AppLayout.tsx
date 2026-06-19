'use client'
import React, { useState, useEffect } from 'react'
import { Box, useTheme, useMediaQuery } from '@mui/material'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'
import { useCurrentUser } from '@/features/auth/api/use-auth'
import { useAuthStore } from '@/store/auth-store'
import { axiosInstance } from '@/shared/api/axios-instance'
import { setAccessTokenInStore } from '@/store/auth-store'

const DRAWER_WIDTH = 240

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))

  const { data: currentUser } = useCurrentUser()
  const setUser = useAuthStore((s) => s.setUser)

  // 새로고침 시 session 쿠키가 있으면 proactive refresh → isAuthenticated 복원
  useEffect(() => {
    const hasSession = document.cookie.includes('auth_session=1')
    if (hasSession) {
      axiosInstance
        .post<{ accessToken: string }>('/api/v1/auth/refresh')
        .then(({ data }) => setAccessTokenInStore(data.accessToken))
        .catch(() => {
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

        {/* 콘텐츠 */}
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3 },
            overflow: 'auto',
            borderRight: '1px solid',
            borderLeft: '1px solid',
            borderColor: 'divider',
          }}
        >
          {children}
        </Box>

        {/* 푸터 */}
        <Footer />
      </Box>
    </Box>
  )
}
