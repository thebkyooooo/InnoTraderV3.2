'use client'

import React from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import type { Breakpoint } from '@mui/material/styles'

const PRESETS = ['xs', 'sm', 'md', 'lg', 'xl'] as const

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  /** MUI 프리셋('xs'~'xl') 또는 커스텀 크기 ('360px', 720 등) */
  maxWidth?: Breakpoint | number | string
  actions?: React.ReactNode
}

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'sm',
  actions,
}: ModalProps) {
  const isPreset = typeof maxWidth === 'string' && (PRESETS as readonly string[]).includes(maxWidth)
  const custom = !isPreset

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={isPreset ? (maxWidth as Breakpoint) : false}
      slotProps={custom ? { paper: { sx: { maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth } } } : undefined}
    >
      {title && (
        <DialogTitle sx={{ p: 3, pb: 1.5, fontSize: '16px', fontWeight: 'bold' }}>
          {title}
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ position: 'absolute', right: 10, top: 14 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
      )}
      <DialogContent sx={{ pb: 3 }}>{children}</DialogContent>
      {actions && <DialogActions sx={{ p: 3, pt: 0 }}>{actions}</DialogActions>}
    </Dialog>
  )
}
