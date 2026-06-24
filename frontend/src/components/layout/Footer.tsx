import React from 'react'
import { Box, Typography } from '@mui/material'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <Box
      component="footer"
      sx={{
        px: 3,
        py: 1,
        textAlign: 'center',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        borderRadius: { md:'0 0 0 10px' },
      }}
    >
      <Typography variant="caption" color="text.secondary">
        © {year} InnoTrader. All rights reserved.
      </Typography>
    </Box>
  )
}
