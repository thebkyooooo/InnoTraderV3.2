'use client'
import React from 'react'
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Button,
} from '@mui/material'
import { Menu as MenuIcon, LogoutOutlined } from '@mui/icons-material'
import { useAuthStore } from '@/store/auth-store'
import { useLogout } from '@/features/auth/api/use-auth'

interface HeaderProps {
  onMenuToggle: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const user = useAuthStore((s) => s.user)
  const { mutate: logout } = useLogout()

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        borderRadius: '10px 0 0 0',
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
