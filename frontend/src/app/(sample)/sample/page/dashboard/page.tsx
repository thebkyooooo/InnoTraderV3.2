'use client'

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'

import { Card } from '@/components/ui/Card'

export default function SampleDashboardPage() {
  return (
    <>

      <div className="flex flex-col gap-4 w-full h-full p-4">
      
        <Card title="삼성전자" subtitle="005930" sx={{ minWidth: 200 }}>
          <Typography variant="h6">₩72,300</Typography>
          <Typography variant="h6">₩72,300</Typography>
          <Typography variant="h6">₩72,300</Typography>
          <Typography variant="h6">₩72,300</Typography>
          <Typography variant="body2" color="success.main">+1.2%</Typography>
        </Card>
      
      </div>

    </>
  )
}
