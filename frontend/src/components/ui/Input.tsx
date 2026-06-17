'use client'

import React from 'react'
import TextField, { TextFieldProps as MuiTextFieldProps } from '@mui/material/TextField'

interface InputProps extends Omit<MuiTextFieldProps, 'error'> {
  label?: string
  helperText?: string
  error?: boolean
}

export function Input({ label, helperText, error = false, fullWidth = true, ...props }: InputProps) {
  return (
    <TextField
      label={label}
      helperText={helperText}
      error={error}
      fullWidth={fullWidth}
      {...props}
    />
  )
}
