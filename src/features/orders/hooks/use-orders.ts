import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/use-session'
import { createOrder, fetchOrder } from '@/features/orders/api/orders-api'
import { idempotencyKeyFor } from '@/features/orders/attempt'
import type { CreateOrderData } from '@/features/orders/schemas'
import { privateKey } from '@/shared/lib/query-keys'
import { useRealtimeConnected } from '@/shared/lib/realtime-status'

export const orderKeys = {
  detail: (userId: string, orderId: string) => privateKey(userId, 'orders', orderId),
}

/** Intervalo da consulta de reserva, usada só quando o socket está fora do ar. */
const fallbackPollMs = 2000

/**
 * Estado do pedido. A mudança de pendente para confirmado ou recusado chega pelo evento
 * `order.updated`, que atualiza este cache. Se a conexão de tempo real cair com o pedido
 * pendente, a API passa a ser consultada periodicamente até a conexão voltar ou o pedido
 * chegar a um estado final.
 */
export function useOrder(orderId: string) {
  const { user } = useSession()
  const realtimeConnected = useRealtimeConnected()
  return useQuery({
    queryKey: orderKeys.detail(user?.id ?? '', orderId),
    queryFn: ({ signal }) => fetchOrder(orderId, signal),
    enabled: user !== null,
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' && !realtimeConnected ? fallbackPollMs : false,
  })
}

/** Cria o pedido com a chave de idempotência da tentativa atual. */
export function useCreateOrder() {
  const queryClient = useQueryClient()
  const { user } = useSession()

  return useMutation({
    mutationFn: (input: CreateOrderData) => {
      if (!user) throw new Error('É preciso entrar na conta para comprar.')
      return createOrder(input, idempotencyKeyFor(user.id, input))
    },
    onSuccess: (order) => {
      if (user) queryClient.setQueryData(orderKeys.detail(user.id, order.id), order)
    },
  })
}
