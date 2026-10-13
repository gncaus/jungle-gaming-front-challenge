import { z } from 'zod'
import { nftDetailSchema } from '@/features/catalog/schemas'
import { orderSchema } from '@/features/orders/schemas'

/**
 * Envelope comum dos eventos em tempo real.
 * `id` identifica o evento (para descartar duplicatas) e `version` é a versão do recurso
 * depois da mudança (para descartar eventos mais antigos que o estado já aplicado).
 */
const envelope = {
  id: z.string(),
  resourceId: z.string(),
  version: z.number().int().positive(),
  occurredAt: z.iso.datetime(),
}

export const nftUpdatedEventSchema = z.object({
  ...envelope,
  type: z.literal('nft.updated'),
  resource: z.literal('nft'),
  /** Preço e disponibilidade atuais do NFT e de cada edição. */
  payload: nftDetailSchema.pick({ price: true, previousPrice: true, soldOut: true, editions: true }),
})
export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>

export const orderUpdatedEventSchema = z.object({
  ...envelope,
  type: z.literal('order.updated'),
  resource: z.literal('order'),
  payload: orderSchema,
})
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>

export const realtimeEventSchema = z.discriminatedUnion('type', [
  nftUpdatedEventSchema,
  orderUpdatedEventSchema,
])
export type RealtimeEvent = z.infer<typeof realtimeEventSchema>

export const realtimeEventTypes = ['nft.updated', 'order.updated'] as const

/**
 * Caminho do servidor Socket.IO, na mesma origem da aplicação.
 * Não é o padrão `/socket.io/` porque o MSW remove esse prefixo da URL antes de procurar
 * o handler, e a conexão passaria a se confundir com qualquer outro WebSocket da origem.
 */
export const socketPath = '/realtime/'
