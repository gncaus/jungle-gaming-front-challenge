import { z } from 'zod'
import { emailSchema } from '@/features/auth/schemas'
import { networkSchema } from '@/features/catalog/schemas'

export const walletSlots = ['primary', 'secondary'] as const
export const walletSlotSchema = z.enum(walletSlots)
export type WalletSlot = z.infer<typeof walletSlotSchema>

export const walletProviders = ['metamask', 'walletconnect', 'coinbase'] as const
export const walletProviderSchema = z.enum(walletProviders, 'Selecione uma carteira')
export type WalletProvider = z.infer<typeof walletProviderSchema>

const requiredText = (max: number) =>
  z.string().trim().min(2, 'Use pelo menos 2 caracteres').max(max, `Use no máximo ${max} caracteres`)

/** Rótulo do nome ENS, sem o sufixo `.eth`. */
export const ensNameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{3,32}$/, 'Use de 3 a 32 letras minúsculas, números ou hífen')

export const walletInputSchema = z.object({
  displayName: requiredText(60),
  nickname: requiredText(40),
  network: z.enum(networkSchema.options, 'Selecione uma rede'),
  profileName: requiredText(60),
  address: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Informe um endereço 0x com 40 caracteres hexadecimais'),
  /** ENS ou endereço de uma carteira secundária; opcional. */
  secondaryAddress: z.string().trim().max(80, 'Use no máximo 80 caracteres').default(''),
  provider: walletProviderSchema,
  referralCode: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9-]{4,20}$/, 'Use de 4 a 20 letras, números ou hífen'),
  email: emailSchema,
  ensName: ensNameSchema,
})
export type WalletInput = z.input<typeof walletInputSchema>

export const walletSchema = walletInputSchema.extend({
  slot: walletSlotSchema,
  /** Conexão simulada com a carteira; o pedido exige `connected`. */
  connection: z.enum(['connected', 'disconnected']),
  updatedAt: z.iso.datetime(),
})
export type Wallet = z.infer<typeof walletSchema>

export const walletsSchema = z.object({
  primary: walletSchema.nullable(),
  secondary: walletSchema.nullable(),
})
export type Wallets = z.infer<typeof walletsSchema>
