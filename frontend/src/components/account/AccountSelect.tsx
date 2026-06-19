'use client'
import React, { useEffect, useState } from 'react'
import { Select } from '@/components/ui/Select'
import { accountApi, type Account } from '@/features/account/api/account-api'
import { useAuthStore } from '@/store/auth-store'

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
  const [accounts, setAccounts] = useState<Account[]>([])
  const accessToken = useAuthStore(s => s.accessToken)

  useEffect(() => {
    if (!accessToken) return
    accountApi.getAccountList()
      .then(res => {
        setAccounts(res.data)
        if (autoSelectFirst && !value && res.data.length > 0) onChange(res.data[0].accountNo)
      })
      .catch(() => setAccounts([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  return (
    <Select
      fullWidth={fullWidth}
      size={size}
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      options={accounts.map(a => ({
        label: `${a.accountNo} ${a.accountName} [${a.typeName}]`,
        value: a.accountNo,
      }))}
      menuItemSx={{ fontSize: '0.875rem' }}
    />
  )
}
