import { Box, Typography } from '@mui/material'
import { Construction } from '@mui/icons-material'

export default function ComingSoonPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        gap: 2,
        color: 'text.secondary',
      }}
    >
      <Construction sx={{ fontSize: 48, color: 'text.disabled' }} />
      <Typography variant="h6" sx={{ fontWeight: 600 }} color="text.primary">
        준비 중입니다
      </Typography>
      <Typography variant="body2">
        해당 기능은 현재 개발 중입니다.
      </Typography>
    </Box>
  )
}
