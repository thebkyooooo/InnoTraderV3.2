/** 천단위 콤마 (ko-KR). */
export const won = (n: number) => n.toLocaleString('ko-KR')

/** 입력 문자열에서 숫자만 추출. */
export const parseDigits = (s: string) => s.replace(/[^\d]/g, '')

/** 매수=적색 / 매도=청색 (국내 HTS 관례). */
export const BUY_COLOR = '#ef5350'
export const SELL_COLOR = '#4285f4'
