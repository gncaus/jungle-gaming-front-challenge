import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/use-session'
import { createOrder, fetchOrder } from '@/features/orders/api/orders-api'
import { idempotencyKeyFor } from '@/features/orders/attempt'
import type { CreateOrderData } from '@/features/orders/schemas'
import { privateKey } from '@/shared/lib/query-keys'

export const orderKeys = {
  detail: (userId: string, orderId: string) => privateKey(userId, 'orders', orderId),
}

/** Intervalo de consulta enquanto o pedido está pendente. */
const pendingPollMs = 1000

/**
 * Estado do pedido. Enquanto estiver pendente, a API é consultada de novo a cada segundo;
 * confirmado e recusado são finais, e a consulta periódica para.
 */
export function useOrder(orderId: string) {
  const { user } = useSession()
  return useQuery({
    queryKey: orderKeys.detail(user?.id ?? '', orderId),
    queryFn: ({ signal }) => fetchOrder(orderId, signal),
    enabled: user !== null,
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? pendingPollMs : false),
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
