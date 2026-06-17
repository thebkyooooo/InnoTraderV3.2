'use client'

import React from 'react'
import MuiSwitch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'

interface ToggleSwitchProps {
  label?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  labelPlacement?: 'start' | 'end' | 'top' | 'bottom'
}

export function ToggleSwitch({
  label,
  checked,
  onChange,
  disabled = false,
  labelPlacement = 'end',
}: ToggleSwitchProps) {
  const switchEl = (
    <MuiSwitch
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
    />
  )

  if (!label) return switchEl

  return (
    <FormControlLabel
      label={label}
      labelPlacement={labelPlacement}
      disabled={disabled}
      control={switchEl}
    />
  )
}
