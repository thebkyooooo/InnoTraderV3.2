'use client'

import React from 'react'
import Dialog from '@mui/material/Dialog'
import type { DialogProps } from '@mui/material/Dialog'
import type { Breakpoint } from '@mui/material/styles'

const PRESETS = ['xs', 'sm', 'md', 'lg', 'xl'] as const
const toCss = (v: number | string) => (typeof v === 'number' ? `${v}px` : v)

export interface ModalProps extends Omit<DialogProps, 'maxWidth'> {
  /**
   * 다이얼로그 최대 폭.
   * - 프리셋: `'xs' | 'sm' | 'md' | 'lg' | 'xl'`
   * - 직접 지정: 숫자(px) 또는 문자열(`'720px'`, `'90vw'`)
   * - `false`: 제한 없음
   */
  maxWidth?: Breakpoint | number | string | false
  /** 고정 폭 (number=px) */
  width?: number | string
  /** 고정 높이 (number=px) */
  height?: number | string
}

/**
 * MUI Dialog 래퍼. `maxWidth`에 프리셋뿐 아니라 직접 px(숫자)·문자열을 지정할 수 있다.
 * 커스텀 값이면 Dialog의 프리셋 상한을 해제(`maxWidth={false}`)하고 Paper에 직접 적용한다.
 */
export function Modal({ maxWidth, width, height, fullWidth, slotProps, ...rest }: ModalProps) {
  const isPreset = typeof maxWidth === 'string' && (PRESETS as readonly string[]).includes(maxWidth)
  const custom = !isPreset && maxWidth != null && maxWidth !== false

  const paperSx = {
    ...(custom ? { maxWidth: toCss(maxWidth as number | string) } : {}),
    ...(width != null ? { width: toCss(width) } : {}),
    ...(height != null ? { height: toCss(height) } : {}),
  }

  return (
    <Dialog
      {...rest}
      // 커스텀 px maxWidth면 기본적으로 그 폭을 채운다(= fullWidth). 명시 지정 시 우선.
      fullWidth={fullWidth ?? custom}
      maxWidth={custom ? false : (maxWidth as Breakpoint | false | undefined)}
      slotProps={{ ...slotProps, paper: { sx: paperSx } }}
    />
  )
}
