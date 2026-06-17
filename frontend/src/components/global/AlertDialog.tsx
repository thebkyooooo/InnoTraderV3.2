'use client'

import React from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import { Button } from '@/components/ui/Button'

interface AlertDialogProps {
  open: boolean
  onClose: () => void
  title?: string
  message: string
  confirmLabel?: string
}

export function AlertDialog({
  open,
  onClose,
  title,
  message,
  confirmLabel = '확인',
}: AlertDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      {title && <DialogTitle>{title}</DialogTitle>}
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
