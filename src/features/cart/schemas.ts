import { z } from 'zod'
import { nftImageSchema, networkSchema } from '@/features/catalog/schemas'
import { ethAmountSchema } from '@/shared/lib/money'

export const quantitySchema = z
  .number('Informe a quantidade')
  .int('A quantidade deve ser um número inteiro')
  .min(1, 'A quantidade mínima é 1')

export const cartItemSchema = z.object({
  id: z.string(),
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
  /** Unidades disponíveis da edição neste momento. */
  available: z.number().int().nonnegative(),
  /** Maior quantidade aceita para o item: o menor entre o estoque e o limite por pedido. */
  maxQuantity: z.number().int().nonnegative(),
  /** `insufficient-stock` quando a quantidade no carrinho passou a exceder o estoque. */
  status: z.enum(['ok', 'insufficient-stock']),
  nftVersion: z.number().int().nonnegative(),
})
export type CartItem = z.infer<typeof cartItemSchema>

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  /** Soma das quantidades. */
  itemCount: z.number().int().nonnegative(),
  subtotal: ethAmountSchema,
  updatedAt: z.iso.datetime(),
})
export type Cart = z.infer<typeof cartSchema>

export const addCartItemInputSchema = z.object({
  nftId: z.string().min(1),
  editionId: z.string().min(1),
  quantity: quantitySchema,
})
export type AddCartItemInput = z.infer<typeof addCartItemInputSchema>

export const updateCartItemInputSchema = z.object({
  quantity: quantitySchema,
})
export type UpdateCartItemInput = z.infer<typeof updateCartItemInputSchema>

/** `details` do erro INSUFFICIENT_STOCK. */
export const stockConflictSchema = z.object({
  items: z.array(
    z.object({
      nftId: z.string(),
      editionId: z.string(),
      requested: z.number().int(),
      available: z.number().int().nonnegative(),
      maxQuantity: z.number().int().nonnegative(),
    }),
  ),
})
export type StockConflict = z.infer<typeof stockConflictSchema>
