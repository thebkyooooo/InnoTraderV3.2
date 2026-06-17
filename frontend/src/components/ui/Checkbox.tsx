'use client'

import React from 'react'
import MuiCheckbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'

interface CheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  indeterminate?: boolean
}

export function Checkbox({ label, checked, onChange, disabled = false, indeterminate = false }: CheckboxProps) {
  return (
    <FormControlLabel
      label={label}
      disabled={disabled}
      control={
        <MuiCheckbox
          checked={checked}
          indeterminate={indeterminate}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
      }
    />
  )
}
