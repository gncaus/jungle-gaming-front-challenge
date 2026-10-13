import { z } from 'zod'
import { nftImageSchema, networkSchema } from '@/features/catalog/schemas'
import { ethAmountSchema } from '@/shared/lib/money'

export const quoteInputSchema = z.object({
  couponCode: z.string().trim().min(1).max(40).nullable().default(null),
})
export type QuoteInput = z.input<typeof quoteInputSchema>

export const quoteItemSchema = z.object({
  nftId: z.string(),
  editionId: z.string(),
  name: z.string(),
  tokenId: z.string(),
  image: nftImageSchema,
  network: networkSchema,
  editionLabel: z.string(),
  unitPrice: ethAmountSchema,
  quantity: z.number().int().positive(),
  lineTotal: ethAmountSchema,
})
export type QuoteItem = z.infer<typeof quoteItemSchema>

export const appliedCouponSchema = z.object({
  code: z.string(),
  description: z.string(),
  percent: z.number().int().min(1).max(100),
})

/**
 * Cotação do carrinho. É a referência de valores para o pedido: `version` identifica
 * exatamente este conjunto de itens, preços, cupom e taxas.
 */
export const quoteSchema = z.object({
  version: z.string(),
  items: z.array(quoteItemSchema).min(1),
  subtotal: ethAmountSchema,
  discount: ethAmountSchema,
  coupon: appliedCouponSchema.nullable(),
  networkFee: ethAmountSchema,
  total: ethAmountSchema,
  createdAt: z.iso.datetime(),
})
export type Quote = z.infer<typeof quoteSchema>

/** `details` do erro QUOTE_STALE: a cotação atual, que o usuário precisa confirmar de novo. */
export const quoteStaleSchema = z.object({
  quote: quoteSchema,
})
export type QuoteStale = z.infer<typeof quoteStaleSchema>
