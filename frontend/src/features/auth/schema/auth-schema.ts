import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})

export const registerSchema = z
  .object({
    email: z.string().email('올바른 이메일을 입력해주세요.'),
    password: z
      .string()
      .min(8, '비밀번호는 8자 이상이어야 합니다.')
      .max(100, '비밀번호는 100자 이하여야 합니다.')
      .regex(/[A-Z]/, '대문자를 하나 이상 포함해야 합니다.')
      .regex(/[0-9]/, '숫자를 하나 이상 포함해야 합니다.'),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
