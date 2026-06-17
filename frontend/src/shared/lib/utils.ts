import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Tailwind CSS 클래스를 조건부로 병합
 * shadcn/ui 컴포넌트에서 표준으로 사용하는 유틸리티
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * 금액을 통화 형식으로 포맷
 *
 * @example
 * formatCurrency(1234567)          // '₩1,234,567'
 * formatCurrency(1234.56, 'USD')   // '$1,234.56'
 * formatCurrency(1234567, 'KRW')   // '₩1,234,567'
 */
export function formatCurrency(
  amount: number,
  currency: string = 'KRW',
  locale: string = 'ko-KR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'KRW' ? 0 : 2,
    maximumFractionDigits: currency === 'KRW' ? 0 : 2,
  }).format(amount)
}

/**
 * 숫자를 천 단위 구분자와 함께 포맷
 *
 * @example
 * formatNumber(1234567)      // '1,234,567'
 * formatNumber(1234.567, 2)  // '1,234.57'
 */
export function formatNumber(
  num: number,
  decimals: number = 0,
  locale: string = 'ko-KR'
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

/**
 * 등락률 포맷 (부호 포함)
 *
 * @example
 * formatChangeRate(2.35)   // '+2.35%'
 * formatChangeRate(-1.2)   // '-1.20%'
 * formatChangeRate(0)      // '0.00%'
 */
export function formatChangeRate(rate: number): string {
  const sign = rate > 0 ? '+' : ''
  return `${sign}${rate.toFixed(2)}%`
}

/**
 * 등락 금액 포맷 (부호 + 통화)
 *
 * @example
 * formatChangeCurrency(1500, 'KRW')   // '+₩1,500'
 * formatChangeCurrency(-200, 'KRW')   // '-₩200'
 */
export function formatChangeCurrency(
  amount: number,
  currency: string = 'KRW'
): string {
  const sign = amount > 0 ? '+' : ''
  return `${sign}${formatCurrency(amount, currency)}`
}

/**
 * 날짜를 한국 형식으로 포맷
 *
 * @example
 * formatDate(new Date())              // '2026. 6. 10.'
 * formatDate(new Date(), 'datetime')  // '2026. 6. 10. 오후 6:53'
 */
export function formatDate(
  date: Date | string | number,
  format: 'date' | 'datetime' | 'time' = 'date'
): string {
  const d = date instanceof Date ? date : new Date(date)

  if (format === 'time') {
    return new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(d)
  }

  if (format === 'datetime') {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

/**
 * 값이 양수인지 음수인지에 따라 Tailwind 색상 클래스 반환
 * 트레이딩 UI에서 등락 표시에 사용
 */
export function getPriceColorClass(value: number): string {
  if (value > 0) return 'text-profit'
  if (value < 0) return 'text-loss'
  return 'text-foreground'
}

/**
 * 주어진 밀리초 후 resolve되는 Promise (테스트/개발용)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
