'use client'

import React from 'react'
import MuiTable from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

interface ColumnDef<T> {
  key: keyof T | string
  label: string
  width?: number | string
  align?: 'left' | 'center' | 'right'
  render?: (value: unknown, row: T) => React.ReactNode
}

interface TableProps<T = Record<string, unknown>> {
  rows: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  emptyMessage?: string
  stickyHeader?: boolean
  maxHeight?: number | string
}

export function Table<T = Record<string, unknown>>({
  rows,
  columns,
  loading = false,
  emptyMessage = '데이터가 없습니다.',
  stickyHeader = false,
  maxHeight,
}: TableProps<T>) {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={maxHeight ? { maxHeight, overflow: 'auto' } : undefined}
    >
      <MuiTable stickyHeader={stickyHeader} size="medium">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell
                key={String(col.key)}
                align={col.align ?? 'left'}
                width={col.width}
                sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, rowIdx) => (
              <TableRow key={rowIdx}>
                {columns.map((col) => (
                  <TableCell key={String(col.key)}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, rowIdx) => (
              <TableRow key={rowIdx} hover>
                {columns.map((col) => {
                  const value = (row as Record<string, unknown>)[String(col.key)]
                  return (
                    <TableCell
                      key={String(col.key)}
                      align={col.align ?? 'left'}
                    >
                      {col.render ? col.render(value, row) : String(value ?? '')}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </MuiTable>
    </TableContainer>
  )
}
