'use client'
import React from 'react'
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Button,
  Tooltip,
} from '@mui/material'
import { Menu as MenuIcon, LogoutOutlined, SensorsOutlined, SensorsOffOutlined } from '@mui/icons-material'
import { useAuthStore } from '@/store/auth-store'
import { useRealtimeStore } from '@/store/realtime-store'
import { useLogout } from '@/features/auth/api/use-auth'

interface HeaderProps {
  onMenuToggle: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const user = useAuthStore((s) => s.user)
  const realtimeEnabled = useRealtimeStore((s) => s.enabled)
  const toggleRealtime = useRealtimeStore((s) => s.toggle)
  const { mutate: logout } = useLogout()

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        left: { xs: 0, md: '245px' },
        width: { xs: '100%', md: 'calc(100% - 245px)' },
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        borderRadius: { md:'10px 0 0 0'}
      }}
    >
      <Toolbar sx={{ gap: 1, minHeight: { xs: '46px !important', sm: '54px !important' } }}>
        {/* 햄버거 메뉴 */}
        <IconButton
          edge="start"
          aria-label="메뉴 열기"
          onClick={onMenuToggle}
          size="medium"
          sx={{ color: 'text.secondary' }}
        >
          <MenuIcon />
        </IconButton>

        {/* 로고 - 사이드바 없는 모바일에서만 표시 */}
        <Typography
          variant="h6"
          color="primary"
          sx={{ letterSpacing: '-0.5px', fontWeight: 700, display: { xs: 'block', md: 'none' } }}
        >
          InnoTrader
        </Typography>

        <Box sx={{ flex: 1 }} />

        {/* 우측 영역 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* 실시간 시세 on/off */}
          <Tooltip title={realtimeEnabled ? '실시간 켜짐' : '실시간 꺼짐'}>
            <IconButton
              size="small"
              onClick={toggleRealtime}
              aria-label={realtimeEnabled ? '실시간 끄기' : '실시간 켜기'}
              sx={{ color: realtimeEnabled ? 'success.main' : 'text.disabled', p: 0 }}
            >
              {realtimeEnabled ? <SensorsOutlined fontSize="small" /> : <SensorsOffOutlined fontSize="small" />}
            </IconButton>
          </Tooltip>
          {user?.email && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: { xs: 'none', sm: 'block' } }}
            >
              {user.email}
            </Typography>
          )}
          <IconButton
            size="small"
            onClick={() => logout()}
            sx={{ color: 'text.secondary', p: 0 }}
          >
            <LogoutOutlined fontSize="small" />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
