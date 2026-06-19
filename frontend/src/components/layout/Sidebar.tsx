'use client'
import React, { useState, type ElementType } from 'react'
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
} from '@mui/material'
import {
  ExpandLess,
  ExpandMore,
  Dashboard,
  Star,
  WorkspacePremium,
  TrendingUp,
  Assignment,
  Settings,
} from '@mui/icons-material'
import { MENU_ITEMS, type MenuItem } from '@/config/menu.config'

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
  Settings: Settings,
}

interface MenuItemRowProps {
  item: MenuItem
  depth?: number
}

function MenuItemRow({ item, depth = 0 }: MenuItemRowProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)

  const hasChildren = Boolean(item.children?.length)
  const IconComponent = item.icon ? ICON_MAP[item.icon] : undefined

  const isActive = hasChildren
    ? pathname.startsWith(item.path)
    : pathname === item.path

  const handleToggle = () => {
    if (hasChildren) setExpanded((prev) => !prev)
  }

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton
          component={hasChildren ? 'div' : Link}
          {...(!hasChildren ? { href: item.path } : {})}
          onClick={handleToggle}
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
              <MenuItemRow key={child.key} item={child} depth={depth + 1} />
            ))}
          </List>
        </Collapse>
      )}
    </>
  )
}

function SidebarContent() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 로고 영역 */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1  }}>
        <Typography
          variant="h6"
          color="primary"
          sx={{ letterSpacing: '-0.5px', fontWeight: 700 }}
        >
          InnoTrader
        </Typography>
      </Box>

      {/* 메뉴 목록 */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 0 }}>
        <List disablePadding>
          {MENU_ITEMS.map((item) => (
            <MenuItemRow key={item.key} item={item} />
          ))}
        </List>
      </Box>
    </Box>
  )
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const visible = !isMobile || open

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
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
          borderRadius: '0 20px 20px 0',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1200,
          transform: visible ? 'translateX(0)' : `translateX(-${DRAWER_WIDTH}px)`,
          transition: 'transform 0.25s ease',
        }}
      >
        <SidebarContent />
      </Box>
    </>
  )
}
