'use client'

import React from 'react'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'

interface SegmentedControlProps<T extends string = string> {
  value: T
  onChange: (value: T) => void
  options: Array<{ label: string; value: T; disabled?: boolean }>
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
}

export function SegmentedControl<T extends string = string>({
  value,
  onChange,
  options,
  size = 'medium',
  fullWidth = false,
}: SegmentedControlProps<T>) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, newValue: T | null) => {
        if (newValue !== null) onChange(newValue)
      }}
      size={size}
      fullWidth={fullWidth}
    >
      {options.map((option) => (
        <ToggleButton
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
