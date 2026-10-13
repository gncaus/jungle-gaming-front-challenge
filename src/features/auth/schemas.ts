import { z } from 'zod'

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Use pelo menos 3 caracteres')
  .max(24, 'Use no máximo 24 caracteres')
  .regex(/^[a-zA-Z0-9._-]+$/, 'Use apenas letras, números, ponto, hífen e sublinhado')

export const emailSchema = z.email('Informe um e-mail válido').trim().max(120)

export const passwordSchema = z
  .string()
  .min(8, 'Use pelo menos 8 caracteres')
  .max(72, 'Use no máximo 72 caracteres')
  .regex(/[a-zA-Z]/, 'Inclua pelo menos uma letra')
  .regex(/\d/, 'Inclua pelo menos um número')

export const registerInputSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((input) => input.password === input.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  })
export type RegisterInput = z.infer<typeof registerInputSchema>

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha'),
})
export type LoginInput = z.infer<typeof loginInputSchema>

export const sessionUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
})
export type SessionUser = z.infer<typeof sessionUserSchema>

/** Resposta de `GET /auth/session`. */
export const sessionSchema = z.object({
  user: sessionUserSchema,
  expiresAt: z.iso.datetime(),
})
export type Session = z.infer<typeof sessionSchema>

/** Resposta de login e cadastro: a sessão mais o token a enviar em `Authorization: Bearer`. */
export const authResultSchema = sessionSchema.extend({
  token: z.string(),
})
export type AuthResult = z.infer<typeof authResultSchema>
