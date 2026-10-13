import { z } from 'zod'
import { emailSchema, passwordSchema, usernameSchema } from '@/features/auth/schemas'
import { ensNameSchema } from '@/features/wallets/schemas'

export const profileInputSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Use pelo menos 2 caracteres')
    .max(60, 'Use no máximo 60 caracteres'),
  username: usernameSchema,
  email: emailSchema,
  ensName: ensNameSchema,
  walletNickname: z
    .string()
    .trim()
    .min(2, 'Use pelo menos 2 caracteres')
    .max(40, 'Use no máximo 40 caracteres'),
})
export type ProfileInput = z.input<typeof profileInputSchema>

/** Contas recém-criadas ainda não têm ENS nem apelido de carteira: chegam como string vazia. */
export const profileSchema = z.object({
  displayName: z.string(),
  username: z.string(),
  email: z.string(),
  ensName: z.string(),
  walletNickname: z.string(),
  avatarUrl: z.string().nullable(),
})
export type Profile = z.infer<typeof profileSchema>

export const maxAvatarDataUrlLength = 300_000

export const avatarInputSchema = z.object({
  /** Imagem PNG, JPEG ou WebP como data URL (cerca de 220 KB no máximo). */
  dataUrl: z
    .string()
    .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/, 'Envie uma imagem PNG, JPEG ou WebP')
    .max(maxAvatarDataUrlLength, 'A imagem deve ter no máximo 220 KB'),
})
export type AvatarInput = z.infer<typeof avatarInputSchema>

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((input) => input.newPassword === input.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  })
  .refine((input) => input.newPassword !== input.currentPassword, {
    path: ['newPassword'],
    message: 'A nova senha deve ser diferente da atual',
  })
export type PasswordChange = z.infer<typeof passwordChangeSchema>
