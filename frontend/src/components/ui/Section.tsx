'use client'

import React from 'react'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

interface SectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
  noPadding?: boolean
  className?: string
}

export function Section({ title, description, children, actions, noPadding = false, className }: SectionProps) {
  const hasHeader = title || description || actions

  return (
    <Paper variant="outlined" className={className} sx={{ display: 'flex', overflow: 'hidden' }}>
      {hasHeader && (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 2,
              px: 2,
              py: 2,
            }}
          >
            <Box>
              {title && (
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {title}
                </Typography>
              )}
              {description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {description}
                </Typography>
              )}
            </Box>
            {actions && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
          </Box>
          <Divider />
        </>
      )}
      <Box sx={{ px: noPadding ? 0 : 2, py: noPadding ? 0 : 2, width: '100%' }}>
        {children}
      </Box>
    </Paper>
  )
}
