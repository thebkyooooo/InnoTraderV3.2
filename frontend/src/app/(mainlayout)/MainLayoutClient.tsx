'use client'
import { usePathname } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import type { SxProps, Theme } from '@mui/material'

const MAIN_SX_MAP: Record<string, SxProps<Theme>> = {
  '/dashboard': { p: { xs: 2, sm: 0 } },
  '/watchlist': { p: { xs: 2, sm: 0 } },
}

export function MainLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const mainSx = MAIN_SX_MAP[pathname]
  return <AppLayout mainSx={mainSx}>{children}</AppLayout>
}
