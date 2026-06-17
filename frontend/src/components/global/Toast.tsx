'use client'

import React from 'react'
import { create } from 'zustand'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'

interface ToastMessage {
  id: string
  message: string
  severity: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastStore {
  toasts: ToastMessage[]
  addToast: (toast: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: `${Date.now()}-${Math.random()}` },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

export function useToast() {
  const addToast = useToastStore((s) => s.addToast)

  return {
    success: (message: string, duration?: number) =>
      addToast({ message, severity: 'success', duration }),
    error: (message: string, duration?: number) =>
      addToast({ message, severity: 'error', duration }),
    warning: (message: string, duration?: number) =>
      addToast({ message, severity: 'warning', duration }),
    info: (message: string, duration?: number) =>
      addToast({ message, severity: 'info', duration }),
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  return (
    <>
      {children}
      <Stack
        spacing={1}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 2000,
          minWidth: 280,
          maxWidth: 400,
        }}
      >
        {toasts.map((toast) => (
          <Snackbar
            key={toast.id}
            open
            autoHideDuration={toast.duration ?? 3000}
            onClose={() => removeToast(toast.id)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            sx={{ position: 'static', transform: 'none' }}
          >
            <Alert
              severity={toast.severity}
              onClose={() => removeToast(toast.id)}
              variant="filled"
              sx={{ width: '100%' }}
            >
              {toast.message}
            </Alert>
          </Snackbar>
        ))}
      </Stack>
    </>
  )
}
