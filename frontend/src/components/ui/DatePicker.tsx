'use client'

import React from 'react'
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import TextField from '@mui/material/TextField'
import FormHelperText from '@mui/material/FormHelperText'
import Box from '@mui/material/Box'
import type { SxProps, Theme } from '@mui/material/styles'
import dayjs, { Dayjs } from 'dayjs'

interface DatePickerProps {
  label?: string
  value: Date | null
  onChange: (date: Date | null) => void
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  error?: boolean
  helperText?: string
  format?: string
  size?: 'small' | 'medium'
  sx?: SxProps<Theme>
}

export function DatePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  disabled = false,
  error = false,
  helperText,
  format = 'YYYY-MM-DD',
  size = 'medium',
  sx,
}: DatePickerProps) {
  const dayjsValue = value ? dayjs(value) : null
  const dayjsMin = minDate ? dayjs(minDate) : undefined
  const dayjsMax = maxDate ? dayjs(maxDate) : undefined

  const handleChange = (newValue: Dayjs | null) => {
    onChange(newValue ? newValue.toDate() : null)
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={sx}>
        <MuiDatePicker
          label={label}
          value={dayjsValue}
          onChange={handleChange}
          minDate={dayjsMin}
          maxDate={dayjsMax}
          disabled={disabled}
          format={format}
          slotProps={{
            textField: {
              error,
              fullWidth: true,
              size,
            },
          }}
        />
        {helperText && (
          <FormHelperText error={error} sx={{ mx: '14px' }}>
            {helperText}
          </FormHelperText>
        )}
      </Box>
    </LocalizationProvider>
  )
}
