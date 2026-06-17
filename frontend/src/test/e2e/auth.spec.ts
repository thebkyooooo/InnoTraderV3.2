import { test, expect } from '@playwright/test'

// ─── 로그인 ────────────────────────────────────────────────────────────────────

test.describe('로그인', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('올바른 자격증명으로 로그인하면 /dashboard로 리다이렉트된다', async ({ page }) => {
    await page.getByLabel('이메일').fill('test@innotrader.com')
    await page.getByLabel('비밀번호').fill('Password1')
    await page.getByRole('button', { name: '로그인' }).click()

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 })
  })

  test('잘못된 자격증명으로 로그인하면 에러 메시지가 표시된다', async ({ page }) => {
    await page.getByLabel('이메일').fill('wrong@innotrader.com')
    await page.getByLabel('비밀번호').fill('WrongPass1')
    await page.getByRole('button', { name: '로그인' }).click()

    await expect(
      page.getByText('이메일 또는 비밀번호가 올바르지 않습니다.')
    ).toBeVisible({ timeout: 10_000 })

    // URL이 /login에 머물러야 함
    await expect(page).toHaveURL(/\/login/)
  })

  test('빈 폼 제출 시 유효성 에러 메시지가 표시된다', async ({ page }) => {
    await page.getByRole('button', { name: '로그인' }).click()

    await expect(
      page.getByText('올바른 이메일을 입력해주세요.')
    ).toBeVisible()
    await expect(
      page.getByText('비밀번호를 입력해주세요.')
    ).toBeVisible()
  })
})

// ─── 보호 경로 ─────────────────────────────────────────────────────────────────

test.describe('보호 경로 (인증 필요)', () => {
  test('인증 없이 /dashboard에 접근하면 /login으로 리다이렉트된다', async ({ page }) => {
    // 쿠키/스토리지 초기화로 미인증 상태 보장
    await page.context().clearCookies()

    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })
})

// ─── 회원가입 ──────────────────────────────────────────────────────────────────

test.describe('회원가입', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('유효한 정보로 회원가입하면 /login으로 리다이렉트된다', async ({ page }) => {
    const uniqueEmail = `user_${Date.now()}@example.com`

    await page.getByLabel('이메일').fill(uniqueEmail)
    // 비밀번호 필드가 여러 개일 경우 first()/last() 또는 placeholder로 구분
    const passwordFields = page.getByLabel('비밀번호')
    await passwordFields.first().fill('Password1')

    const confirmField = page.getByLabel(/비밀번호 확인/)
    await confirmField.fill('Password1')

    await page.getByRole('button', { name: '회원가입' }).click()

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('이미 사용 중인 이메일로 회원가입 시 에러 메시지가 표시된다', async ({ page }) => {
    await page.getByLabel('이메일').fill('existing@innotrader.com')

    const passwordFields = page.getByLabel('비밀번호')
    await passwordFields.first().fill('Password1')

    const confirmField = page.getByLabel(/비밀번호 확인/)
    await confirmField.fill('Password1')

    await page.getByRole('button', { name: '회원가입' }).click()

    await expect(
      page.getByText('이미 사용 중인 이메일입니다.')
    ).toBeVisible({ timeout: 10_000 })
  })

  test('비밀번호 불일치 시 유효성 에러 메시지가 표시된다', async ({ page }) => {
    await page.getByLabel('이메일').fill('newuser@example.com')

    const passwordFields = page.getByLabel('비밀번호')
    await passwordFields.first().fill('Password1')

    const confirmField = page.getByLabel(/비밀번호 확인/)
    await confirmField.fill('DifferentPass1')

    await page.getByRole('button', { name: '회원가입' }).click()

    await expect(
      page.getByText('비밀번호가 일치하지 않습니다.')
    ).toBeVisible()
  })
})
