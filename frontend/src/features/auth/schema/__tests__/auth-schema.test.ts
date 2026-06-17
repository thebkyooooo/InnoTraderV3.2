import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema } from '../auth-schema'

// ─── loginSchema ───────────────────────────────────────────────────────────────

describe('loginSchema', () => {
  it('유효한 이메일과 비밀번호면 파싱에 성공한다', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'anypass',
    })
    expect(result.success).toBe(true)
  })

  it('이메일이 빈 문자열이면 실패한다', () => {
    const result = loginSchema.safeParse({ email: '', password: 'pass' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const emailErrors = result.error.flatten().fieldErrors.email
      expect(emailErrors).toBeDefined()
      expect(emailErrors![0]).toBe('올바른 이메일을 입력해주세요.')
    }
  })

  it('이메일 형식이 잘못되면 실패한다', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'pass' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const emailErrors = result.error.flatten().fieldErrors.email
      expect(emailErrors![0]).toBe('올바른 이메일을 입력해주세요.')
    }
  })

  it('비밀번호가 빈 문자열이면 실패한다', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const passwordErrors = result.error.flatten().fieldErrors.password
      expect(passwordErrors).toBeDefined()
      expect(passwordErrors![0]).toBe('비밀번호를 입력해주세요.')
    }
  })

  it('이메일과 비밀번호 모두 빈 값이면 두 필드 모두 에러가 발생한다', () => {
    const result = loginSchema.safeParse({ email: '', password: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      expect(errors.email).toBeDefined()
      expect(errors.password).toBeDefined()
    }
  })
})

// ─── registerSchema ────────────────────────────────────────────────────────────

describe('registerSchema', () => {
  const validData = {
    email: 'new@example.com',
    password: 'Password1',
    passwordConfirm: 'Password1',
  }

  it('유효한 데이터면 파싱에 성공한다', () => {
    const result = registerSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('비밀번호가 8자 미만이면 실패한다', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'Pass1',       // 5자
      passwordConfirm: 'Pass1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const passwordErrors = result.error.flatten().fieldErrors.password
      expect(passwordErrors).toBeDefined()
      expect(passwordErrors!.some((e) => e.includes('8자 이상'))).toBe(true)
    }
  })

  it('비밀번호에 대문자가 없으면 실패한다', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'password1',   // 대문자 없음
      passwordConfirm: 'password1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const passwordErrors = result.error.flatten().fieldErrors.password
      expect(passwordErrors!.some((e) => e.includes('대문자'))).toBe(true)
    }
  })

  it('비밀번호에 숫자가 없으면 실패한다', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'Passwordonly',  // 숫자 없음
      passwordConfirm: 'Passwordonly',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const passwordErrors = result.error.flatten().fieldErrors.password
      expect(passwordErrors!.some((e) => e.includes('숫자'))).toBe(true)
    }
  })

  it('비밀번호와 비밀번호 확인이 일치하지 않으면 실패한다', () => {
    const result = registerSchema.safeParse({
      ...validData,
      passwordConfirm: 'DifferentPass1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const confirmErrors = result.error.flatten().fieldErrors.passwordConfirm
      expect(confirmErrors).toBeDefined()
      expect(confirmErrors![0]).toBe('비밀번호가 일치하지 않습니다.')
    }
  })

  it('이메일 형식이 잘못되면 실패한다', () => {
    const result = registerSchema.safeParse({
      ...validData,
      email: 'invalid-email',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const emailErrors = result.error.flatten().fieldErrors.email
      expect(emailErrors![0]).toBe('올바른 이메일을 입력해주세요.')
    }
  })

  it('비밀번호가 100자를 초과하면 실패한다', () => {
    const longPassword = 'A1' + 'a'.repeat(100)  // 102자
    const result = registerSchema.safeParse({
      ...validData,
      password: longPassword,
      passwordConfirm: longPassword,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const passwordErrors = result.error.flatten().fieldErrors.password
      expect(passwordErrors!.some((e) => e.includes('100자 이하'))).toBe(true)
    }
  })
})
