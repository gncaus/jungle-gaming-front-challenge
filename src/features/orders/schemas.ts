import { z } from 'zod'
import { networkSchema } from '@/features/catalog/schemas'
import { appliedCouponSchema, quoteItemSchema } from '@/features/checkout/schemas'
import { walletProviderSchema, walletSlotSchema } from '@/features/wallets/schemas'
import { ethAmountSchema } from '@/shared/lib/money'

/** Header obrigatório em `POST /orders`: uma chave por tentativa de compra. */
export const idempotencyHeader = 'Idempotency-Key'

export const createOrderInputSchema = z.object({
  /** Versão da cotação que o usuário revisou e confirmou. */
  quoteVersion: z.string().min(1),
  couponCode: z.string().trim().min(1).max(40).nullable().default(null),
  walletSlot: walletSlotSchema,
  note: z.string().trim().max(280, 'Use no máximo 280 caracteres').default(''),
})
export type CreateOrderInput = z.input<typeof createOrderInputSchema>
export type CreateOrderData = z.output<typeof createOrderInputSchema>

/** Cópia dos valores no momento da compra. Não muda quando o catálogo muda. */
export const receiptSchema = z.object({
  items: z.array(quoteItemSchema).min(1),
  subtotal: ethAmountSchema,
  discount: ethAmountSchema,
  coupon: appliedCouponSchema.nullable(),
  networkFee: ethAmountSchema,
  total: ethAmountSchema,
  wallet: z.object({
    slot: walletSlotSchema,
    provider: walletProviderSchema,
    nickname: z.string(),
    address: z.string(),
    network: networkSchema,
  }),
  note: z.string(),
})
export type Receipt = z.infer<typeof receiptSchema>

export const orderStatuses = ['pending', 'confirmed', 'declined'] as const

/** `pending` é o único estado que ainda muda; `confirmed` e `declined` são terminais. */
export const orderSchema = z.object({
  id: z.string(),
  status: z.enum(orderStatuses),
  /** Cresce a cada mudança de estado; base da ordenação dos eventos `order.updated`. */
  version: z.number().int().positive(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  receipt: receiptSchema,
  /** Referência simulada da transação; só existe em pedido confirmado. */
  transaction: z.object({ hash: z.string(), explorerUrl: z.url() }).nullable(),
  declineReason: z.string().nullable(),
})
export type Order = z.infer<typeof orderSchema>

export const orderListSchema = z.object({
  items: z.array(orderSchema),
})
export type OrderList = z.infer<typeof orderListSchema>
