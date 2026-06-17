'use client'

import React from 'react'
import MuiCard from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import { SxProps, Theme } from '@mui/material/styles'

interface CardProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  actions?: React.ReactNode
  headerAction?: React.ReactNode
  noPadding?: boolean
  sx?: SxProps<Theme>
}

export function Card({ title, subtitle, children, actions, headerAction, noPadding = false, sx }: CardProps) {
  const hasHeader = title || subtitle || headerAction

  return (
    <MuiCard sx={sx}>
      {hasHeader && (
        <CardHeader
          title={title}
          subheader={subtitle}
          action={headerAction}
          slotProps={{ title: { variant: 'h6', sx: { fontWeight: 600 } } }}
        />
      )}
      <CardContent sx={noPadding ? { p: '0 !important' } : { '&:last-child': { pb: 2 } }}>
        {children}
      </CardContent>
      {actions && <CardActions>{actions}</CardActions>}
    </MuiCard>
  )
}
