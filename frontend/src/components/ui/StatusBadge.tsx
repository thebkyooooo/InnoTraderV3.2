'use client'

import React from 'react'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

type StatusType = 'active' | 'inactive' | 'pending' | 'error' | 'success' | 'warning'

interface StatusBadgeProps {
  status: StatusType
  label?: string
  size?: 'small' | 'medium'
  dot?: boolean
}

const statusColorMap: Record<StatusType, 'success' | 'default' | 'warning' | 'error'> = {
  active: 'success',
  success: 'success',
  inactive: 'default',
  pending: 'warning',
  warning: 'warning',
  error: 'error',
}

const dotColorMap: Record<StatusType, string> = {
  active: '#4caf50',
  success: '#4caf50',
  inactive: '#9e9e9e',
  pending: '#ff9800',
  warning: '#ff9800',
  error: '#f44336',
}

export function StatusBadge({ status, label, size = 'small', dot = false }: StatusBadgeProps) {
  const displayLabel = label ?? status

  if (dot) {
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
        <Box
          component="span"
          sx={{
            width: size === 'small' ? 8 : 10,
            height: size === 'small' ? 8 : 10,
            borderRadius: '50%',
            backgroundColor: dotColorMap[status],
            flexShrink: 0,
          }}
        />
        <Typography variant={size === 'small' ? 'caption' : 'body2'}>
          {displayLabel}
        </Typography>
      </Box>
    )
  }

  return (
    <Chip
      label={displayLabel}
      color={statusColorMap[status]}
      size={size}
      variant="filled"
    />
  )
}
