'use client'
import React, { useEffect } from 'react'
import { Select } from '@/components/ui/Select'
import { useAccounts } from '@/features/account/api/use-account'

export interface AccountSelectProps {
  /** 선택된 계좌번호 */
  value: string
  onChange: (accountNo: string) => void
  label?: string
  /** 미선택 시 표시할 placeholder (autoSelectFirst=false 일 때만 보임) */
  placeholder?: string
  size?: 'small' | 'medium'
  fullWidth?: boolean
  /** 목록 로드 시 첫 계좌 자동 선택 (기본 true) */
  autoSelectFirst?: boolean
}

/**
 * 계좌 셀렉트 — 계좌목록 조회 API 연동.
 * 옵션 라벨: "계좌번호 계좌명 [계좌유형]"
 */
export function AccountSelect({
  value,
  onChange,
  label = '계좌 선택',
  placeholder,
  size = 'small',
  fullWidth = true,
  autoSelectFirst = true,
}: AccountSelectProps) {
  const { data: accounts = [] } = useAccounts()

  useEffect(() => {
    if (autoSelectFirst && !value && accounts.length > 0) onChange(accounts[0].accountNo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts])

  // 로그아웃 시 queryClient.clear()로 accounts가 먼저 비워지는 순간(라우팅 언마운트 전)
  // value가 목록에 없는 상태로 MUI Select에 전달되어 out-of-range 경고가 뜨는 것을 방지
  const safeValue = value && !accounts.some(a => a.accountNo === value) ? '' : value

  return (
    <Select
      fullWidth={fullWidth}
      size={size}
      label={label}
      placeholder={placeholder}
      value={safeValue}
      onChange={onChange}
      options={accounts.map(a => ({
        label: `${a.accountNo} ${a.accountName} [${a.typeName}]`,
        value: a.accountNo,
      }))}
      menuItemSx={{ fontSize: '0.875rem' }}
    />
  )
}
