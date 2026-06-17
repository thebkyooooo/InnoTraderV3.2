'use client'

import React from 'react'
import MuiRadio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'

interface RadioGroupProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: Array<{ label: string; value: string; disabled?: boolean }>
  row?: boolean
}

export function Radio({ label, value, onChange, options, row = false }: RadioGroupProps) {
  return (
    <FormControl>
      {label && <FormLabel>{label}</FormLabel>}
      <RadioGroup
        value={value}
        onChange={(e) => onChange(e.target.value)}
        row={row}
      >
        {options.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            label={option.label}
            disabled={option.disabled}
            control={<MuiRadio />}
          />
        ))}
      </RadioGroup>
    </FormControl>
  )
}
