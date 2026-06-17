'use client'

import React from 'react'
import MuiPagination from '@mui/material/Pagination'
import Box from '@mui/material/Box'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
  siblingCount?: number
  showFirstButton?: boolean
  showLastButton?: boolean
}

export function Pagination({
  page,
  totalPages,
  onChange,
  siblingCount = 1,
  showFirstButton = false,
  showLastButton = false,
}: PaginationProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <MuiPagination
        page={page}
        count={totalPages}
        onChange={(_, newPage) => onChange(newPage)}
        siblingCount={siblingCount}
        showFirstButton={showFirstButton}
        showLastButton={showLastButton}
        color="primary"
        shape="rounded"
      />
    </Box>
  )
}
