'use client'

import React from 'react'
import MuiSelect, { SelectChangeEvent } from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormHelperText from '@mui/material/FormHelperText'
import type { SxProps, Theme } from '@mui/material/styles'

interface SelectProps<T extends string | number = string> {
  label?: string
  value: T | ''
  onChange: (value: T) => void
  options: Array<{ label: string; value: T; disabled?: boolean }>
  placeholder?: string
  error?: boolean
  helperText?: string
  fullWidth?: boolean
  size?: 'small' | 'medium'
  disabled?: boolean
  sx?: SxProps<Theme>
  /** 드롭다운 메뉴 항목(MenuItem) 추가 스타일 (예: 폰트 크기) */
  menuItemSx?: SxProps<Theme>
}

export function Select<T extends string | number = string>({
  label,
  value,
  onChange,
  options,
  placeholder,
  error = false,
  helperText,
  fullWidth = false,
  size = 'medium',
  disabled = false,
  sx,
  menuItemSx,
}: SelectProps<T>) {
  const labelId = label ? `select-label-${label.replace(/\s+/g, '-')}` : undefined

  const handleChange = (e: SelectChangeEvent<T | ''>) => {
    const val = e.target.value
    if (val !== '') onChange(val as T)
  }

  return (
    <FormControl fullWidth={fullWidth} error={error} size={size} disabled={disabled} sx={sx}>
      {label && <InputLabel id={labelId}>{label}</InputLabel>}
      <MuiSelect
        labelId={labelId}
        value={value}
        label={label}
        onChange={handleChange}
        MenuProps={{
          anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
          transformOrigin: { vertical: 'top', horizontal: 'left' },
          ...(menuItemSx ? { sx: { '& .MuiMenuItem-root': menuItemSx } as SxProps<Theme> } : {}),
        }}
      >
        {placeholder && (
          <MenuItem value="" disabled>
            {placeholder}
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem key={String(option.value)} value={option.value} disabled={option.disabled}>
            {option.label}
          </MenuItem>
        ))}
      </MuiSelect>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  )
}
