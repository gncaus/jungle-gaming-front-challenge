import {
  idempotencyHeader,
  orderSchema,
  type CreateOrderData,
  type Order,
} from '@/features/orders/schemas'
import { http } from '@/shared/lib/http'

/**
 * Cria o pedido. A chave de idempotência identifica a tentativa: reenviar o mesmo corpo com
 * a mesma chave devolve o pedido já criado, em vez de criar outro.
 */
export async function createOrder(input: CreateOrderData, idempotencyKey: string): Promise<Order> {
  const { data } = await http.post<unknown>('/orders', input, {
    headers: { [idempotencyHeader]: idempotencyKey },
  })
  return orderSchema.parse(data)
}

export async function fetchOrder(orderId: string, signal?: AbortSignal): Promise<Order> {
  const { data } = await http.get<unknown>(`/orders/${encodeURIComponent(orderId)}`, { signal })
  return orderSchema.parse(data)
}
