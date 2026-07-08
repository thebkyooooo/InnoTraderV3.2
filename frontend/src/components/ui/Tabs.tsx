'use client'

import React from 'react'
import MuiTabs from '@mui/material/Tabs'
import MuiTab from '@mui/material/Tab'
import Box from '@mui/material/Box'

interface TabItem {
  value: string | number
  label: string
  icon?: React.ReactNode
  disabled?: boolean
}

interface TabsProps {
  value: string | number
  onChange: (value: string | number) => void
  tabs: TabItem[]
  variant?: 'standard' | 'scrollable' | 'fullWidth'
}

export function Tabs({ value, onChange, tabs, variant = 'standard' }: TabsProps) {
  return (
    <Box sx={{ borderBottom: 0, borderColor: 'divider' }}>
      <MuiTabs
        value={value}
        onChange={(_, newValue: string | number) => onChange(newValue)}
        variant={variant}
        scrollButtons={variant === 'scrollable' ? 'auto' : undefined}
        sx={{ minHeight:'24px' }}
      >
        {tabs.map((tab) => (
          <MuiTab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            icon={tab.icon ? <>{tab.icon}</> : undefined}
            iconPosition="start"
            disabled={tab.disabled}
            sx={{ fontWeight: '600', color: 'gray', p: 0, pb: 1.5, minHeight: '24px', minWidth: 0, px: '0px', mr: 1, textTransform: 'none' }}
          />
        ))}
      </MuiTabs>
    </Box>
  )
}
