'use client'
import React, { useState, useEffect, type ElementType } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
} from '@mui/material'
import {
  ExpandLess,
  ExpandMore,
  Dashboard,
  Star,
  WorkspacePremium,
  TrendingUp,
  Assignment,
  DataExploration,
  PieChart,
  Settings,
  Close,
} from '@mui/icons-material'
import { MENU_ITEMS, type MenuItem } from '@/config/menu.config'
import { isAbsolute } from 'path'

const DRAWER_WIDTH = 240

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const ICON_MAP: Record<string, ElementType> = {
  LayoutDashboard: Dashboard,
  Star: Star,
  Briefcase: WorkspacePremium,
  TrendingUp: TrendingUp,
  ClipboardList: Assignment,
  DataExploration: DataExploration,
  PieChart: PieChart,
  Settings: Settings,
}

interface MenuItemRowProps {
  item: MenuItem
  depth?: number
  /** leaf(이동) 메뉴 클릭 시 호출 — 모바일에서 사이드바 닫기용 */
  onNavigate?: () => void
}

function MenuItemRow({ item, depth = 0, onNavigate }: MenuItemRowProps) {
  const pathname = usePathname()
  const hasChildren = Boolean(item.children?.length)
  const IconComponent = item.icon ? ICON_MAP[item.icon] : undefined

  const isActive = hasChildren
    ? pathname.startsWith(item.path)
    : pathname === item.path

  const [expanded, setExpanded] = useState(isActive)

  // 경로 이동 시 현재 메뉴가 아닌 서브메뉴는 접고, 현재 메뉴는 펼친다
  useEffect(() => {
    setExpanded(isActive)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const handleClick = () => {
    if (hasChildren) setExpanded((prev) => !prev)
    else onNavigate?.()  // leaf 이동 → 닫기 콜백
  }

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton
          component={hasChildren ? 'div' : Link}
          {...(!hasChildren ? { href: item.path } : {})}
          onClick={handleClick}
          selected={isActive}
          disableRipple
          sx={{
            pl: 2 + depth * 3.8,
            borderRadius: 1,
            mx: 0.5,
            mb: 0.25,
            '&:hover': {
              bgcolor: 'transparent',
              color: 'primary.main',
              '& .MuiListItemIcon-root': { color: 'primary.main' },
            },
            '&.Mui-selected': {
              bgcolor: 'transparent',
              color: 'primary.main',
              '&:hover': { bgcolor: 'transparent' },
              '& .MuiListItemIcon-root': { color: 'primary.main' },
            },
            py: 0,
            height: 32,
          }}
        >
          {IconComponent && (
            <ListItemIcon
              sx={{
                minWidth: 30,
                color: isActive ? 'inherit' : 'text.secondary',
              }}
            >
              <IconComponent fontSize="small" />
            </ListItemIcon>
          )}
          <ListItemText
            primary={item.label}
            slotProps={{
              primary: {
                sx: { fontSize: depth > 0 ? 14 : 14, fontWeight: isActive ? 600 : (depth > 0 ? 400 : 500) },
              },
            }}
          />
          {hasChildren && (expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />)}
        </ListItemButton>
      </ListItem>

      {hasChildren && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <List disablePadding>
            {item.children!.map((child) => (
              <MenuItemRow key={child.key} item={child} depth={depth + 1} onNavigate={onNavigate} />
            ))}
          </List>
        </Collapse>
      )}
    </>
  )
}

function SidebarContent({ onNavigate, onClose }: { onNavigate?: () => void; onClose?: () => void }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 로고 영역 */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1, position: 'relative'  }}>
        <Typography
          variant="h6"
          color="primary"
          sx={{ letterSpacing: '-0.5px', fontWeight: 700 }}
        >
          InnoTrader
        </Typography>

        <IconButton
          onClick={onClose}
          aria-label="사이드바 닫기"
          size="small"
          disableRipple
          sx={{
            display: { xs: 'inline-flex', md: 'none' },
            position: 'absolute',
            top: 15,
            right: 14,
            color: 'grey.700',
            bgcolor: 'transparent',
            '&:hover': { color: 'grey.500', bgcolor: 'transparent' },
          }}
        >
          <Close fontSize="medium" sx={{ fontWeight: 700 }} />
        </IconButton>
      </Box>

      {/* 메뉴 목록 */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 0 }}>
        <List disablePadding>
          {MENU_ITEMS.map((item) => (
            <MenuItemRow key={item.key} item={item} onNavigate={onNavigate} />
          ))}
        </List>
      </Box>
    </Box>
  )
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <>
      {isMobile && open && (
        <Box
          onClick={onClose}
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.4)',
            zIndex: 1199,
          }}
        />
      )}
      <Box
        component="aside"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: DRAWER_WIDTH,
          height: '100vh',
          '@supports (height: 100dvh)': { height: '100dvh' },
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
          borderRadius: '0 10px 10px 0',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1200,
          // CSS 미디어쿼리로 표시 여부를 결정 — JS useMediaQuery는 SSR/하이드레이션 시점에
          // 항상 "매치 안 됨"으로 시작해 모바일에서 새로고침 시 사이드바가 잠깐 보였다
          // 사라지는 깜빡임이 있었다. md 이상은 항상 보이고, 그 아래는 open prop으로만 결정.
          transform: {
            xs: open ? 'translateX(0)' : `translateX(-${DRAWER_WIDTH}px)`,
            md: 'translateX(0)',
          },
          transition: 'transform 0.25s ease',
        }}
      >
        <SidebarContent onNavigate={isMobile ? onClose : undefined} onClose={onClose} />
      </Box>
    </>
  )
}
