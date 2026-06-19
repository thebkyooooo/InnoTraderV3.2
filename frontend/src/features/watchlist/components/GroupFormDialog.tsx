'use client'
import React, { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'

export interface GroupFormDialogProps {
  open: boolean
  /** 'add' = 그룹추가, 'rename' = 그룹변경 */
  mode: 'add' | 'rename'
  /** 변경 모드에서 현재 그룹명 */
  currentName?: string
  onClose: () => void
  onSubmit: (groupName: string) => void
}

export function GroupFormDialog({ open, mode, currentName = '', onClose, onSubmit }: GroupFormDialogProps) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) setName('')
  }, [open])

  const submit = () => {
    const v = name.trim()
    if (v) onSubmit(v)
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="360px">
      <DialogTitle sx={{ pt: 3 }}>{mode === 'add' ? '그룹 추가' : '그룹 변경'}</DialogTitle>
      <DialogContent>
        {mode === 'rename' && (
          <p className="text-xs text-gray-500 mb-2">현재 그룹명: <b>{currentName}</b></p>
        )}
        <TextField
          autoFocus
          fullWidth
          size="small"
          label={mode === 'add' ? '그룹명' : '변경할 그룹명'}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit() }}
          slotProps={{ htmlInput: { maxLength: 100 } }}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions sx={{ pt: 0, pb: 3, px: 3 }}>
        <Button variant="outlined" onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={submit} disabled={!name.trim()}>
          {mode === 'add' ? '추가' : '변경'}
        </Button>
      </DialogActions>
    </Modal>
  )
}
