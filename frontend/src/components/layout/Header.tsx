'use client'
import React, { useEffect, useState } from 'react'
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Tooltip,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import { Menu as MenuIcon, LogoutOutlined, SensorsOutlined, SensorsOffOutlined } from '@mui/icons-material'
import { Modal } from '@/components/global/Modal'
import { useAuthStore } from '@/store/auth-store'
import { useRealtimeStore } from '@/store/realtime-store'
import { useLogout } from '@/features/auth/api/use-auth'
import { broadcastApi } from '@/features/admin/api/broadcast-api'

const SPEED_OPTIONS = [
  { value: 100,  label: '0.1초' },
  { value: 200,  label: '0.2초' },
  { value: 500,  label: '0.5초' },
  { value: 1000, label: '1.0초' },
  { value: 2000, label: '2.0초' },
  { value: 5000, label: '5.0초' },
]

interface HeaderProps {
  onMenuToggle: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const user = useAuthStore((s) => s.user)
  const realtimeEnabled = useRealtimeStore((s) => s.enabled)
  const toggleRealtime = useRealtimeStore((s) => s.toggle)
  const { mutate: logout } = useLogout()

  const [broadcastMs, setBroadcastMs] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    broadcastApi.getInterval()
      .then(r => setBroadcastMs(r.data.ms))
      .catch(() => setBroadcastMs(2000))
  }, [])

  const handleSelect = (_: React.MouseEvent, v: number | null) => {
    if (v === null) return
    broadcastApi.setInterval(v)
      .then(() => setBroadcastMs(v))
      .catch(() => {})
    setModalOpen(false)
  }

  const currentLabel = SPEED_OPTIONS.find(o => o.value === broadcastMs)?.label

  return (
    <>
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
          // zIndex: (theme) => theme.zIndex.drawer + 1,
          borderRadius: { md: '10px 0 0 0' },
        }}
      >
        <Toolbar sx={{ gap: 1, minHeight: { xs: '46px !important', sm: '54px !important' } }}>
          <IconButton
            edge="start"
            aria-label="메뉴 열기"
            onClick={onMenuToggle}
            size="medium"
            sx={{ color: 'text.secondary' }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            color="primary"
            sx={{ letterSpacing: '-0.5px', fontWeight: 700, display: { xs: 'block', md: 'none' } }}
          >
            InnoTrader
          </Typography>

          <Box sx={{ flex: 1 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <div className='flex gap-1 items-center'>
              {/* 실시간 시세 on/off */}
              <Tooltip title={realtimeEnabled ? '실시간 켜짐' : '실시간 꺼짐'}>
                <IconButton
                  size="small"
                  onClick={toggleRealtime}
                  aria-label={realtimeEnabled ? '실시간 끄기' : '실시간 켜기'}
                  sx={{ color: realtimeEnabled ? 'success.main' : 'text.disabled', p: 0 }}
                >
                  {realtimeEnabled ? <SensorsOutlined sx={{ fontSize: 30 }} /> : <SensorsOffOutlined sx={{ fontSize: 30 }} />}
                </IconButton>
              </Tooltip>
              
              {/* 시세 갱신 속도 */}
              {currentLabel && (
                <Tooltip title="시세 갱신 속도">
                  <Chip
                    label={currentLabel}
                    size="small"
                    variant="outlined"
                    onClick={(e) => { e.currentTarget.blur(); setModalOpen(true) }}
                    sx={{ height: 24, fontSize: '0.72rem', color: 'text.secondary', borderColor: 'divider', borderRadius: '5px' ,cursor: 'pointer', marginRight: '0px' }}
                  />
                </Tooltip>
              )}
            </div>

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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="시세 갱신 속도"
        maxWidth="260px"
      >
        <ToggleButtonGroup
          exclusive
          orientation="vertical"
          value={broadcastMs}
          onChange={handleSelect}
          sx={{ width: '100%', display: 'flex !important', flexDirection: 'row', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}
        >
          {SPEED_OPTIONS.map(opt => (
            <ToggleButton key={opt.value} value={opt.value} sx={{ border: '1px solid #eee !important', borderRadius: '20px !important', px: 1.5, py: 0.5, mt: '0 !important' }}>
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Modal>
    </>
  )
}
