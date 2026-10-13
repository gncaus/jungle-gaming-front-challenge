import { useQueryClient, type Query, type QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { Socket } from 'socket.io-client'
import { connectRealtime } from '@/app/socket'
import { useToken } from '@/features/auth/hooks/use-session'
import type { Session } from '@/features/auth/schemas'
import { sessionKey } from '@/features/auth/session'
import { catalogKeys } from '@/features/catalog/hooks/queries'
import { orderKeys } from '@/features/orders/hooks/use-orders'
import type { Order } from '@/features/orders/schemas'
import { createEventGuard } from '@/features/realtime/event-guard'
import { nftUpdatedEventSchema, orderUpdatedEventSchema } from '@/features/realtime/schemas'
import { announce } from '@/shared/lib/announce'
import { setRealtimeConnected } from '@/shared/lib/realtime-status'

/** Recursos privados cujo conteúdo depende de preço e disponibilidade dos NFTs. */
const nftDependentResources = ['cart', 'quote']

/** Consultas que mudam quando um NFT muda: todo o catálogo, o carrinho e a cotação. */
function dependsOnNfts(query: Query): boolean {
  const [root, , resource] = query.queryKey
  return (
    root === catalogKeys.all[0] ||
    (root === 'private' && nftDependentResources.includes(String(resource)))
  )
}

/** Tudo o que os eventos mantêm atualizado: o que depende dos NFTs e os pedidos. */
function keptFreshByEvents(query: Query): boolean {
  const [root, , resource] = query.queryKey
  return dependsOnNfts(query) || (root === 'private' && resource === 'orders')
}

/** Aplica um `order.updated` aceito pelo guarda: o estado vai para o cache e o usuário é avisado. */
function applyOrderUpdate(queryClient: QueryClient, userId: string, order: Order): void {
  queryClient.setQueryData(orderKeys.detail(userId, order.id), order)
  if (order.status === 'confirmed') {
    announce('Pagamento confirmado. Seus NFTs estão na sua carteira.')
  } else if (order.status === 'declined') {
    announce('Pagamento recusado. Os itens continuam no seu carrinho.', 'error')
  }
  // A confirmação tira do carrinho o que foi comprado e baixa o estoque.
  void queryClient.invalidateQueries({ predicate: dependsOnNfts })
}

/**
 * Mantém a conexão de tempo real enquanto a aplicação está aberta.
 *
 * - **Sessão:** a conexão pertence à sessão. Quando o token muda (login, logout, expiração),
 *   a conexão anterior é encerrada com seus listeners e outra é aberta com a identidade nova;
 *   um evento endereçado ao usuário anterior não tem como chegar a quem entrou depois.
 * - **Duplicatas e eventos antigos:** todo evento passa pelo guarda antes de ter efeito.
 * - **`nft.updated`:** catálogo, carrinho e cotação são revalidados pela API REST.
 * - **`order.updated`:** o pedido do evento vai para o cache, a menos que o que está em cache
 *   seja mais recente ou já esteja em estado final.
 * - **Reconexão:** eventos emitidos sem conexão não são reentregues, então a cada conexão o
 *   que está em uso é reconciliado pela API REST.
 */
export function RealtimeBridge() {
  const queryClient = useQueryClient()
  const token = useToken()

  useEffect(() => {
    let socket: Socket | undefined
    let unmounted = false
    const guard = createEventGuard()

    void connectRealtime(token ?? undefined).then((connected) => {
      if (unmounted) {
        connected.disconnect()
        return
      }
      socket = connected

      socket.on('connect', () => {
        setRealtimeConnected(true)
        // `cancelRefetch: false` evita refazer uma consulta que já está em andamento.
        void queryClient.invalidateQueries({ predicate: keptFreshByEvents }, { cancelRefetch: false })
      })
      socket.on('disconnect', () => setRealtimeConnected(false))

      socket.on('nft.updated', (data: unknown) => {
        const event = nftUpdatedEventSchema.safeParse(data)
        if (!event.success || !guard.accept(event.data)) return
        void queryClient.invalidateQueries({ predicate: dependsOnNfts })
      })

      socket.on('order.updated', (data: unknown) => {
        const event = orderUpdatedEventSchema.safeParse(data)
        const userId = token ? queryClient.getQueryData<Session>(sessionKey(token))?.user.id : undefined
        if (!event.success || !userId) return

        const cached = queryClient.getQueryData<Order>(orderKeys.detail(userId, event.data.resourceId))
        if (!guard.accept(event.data, cached?.version)) return
        // Confirmado e recusado são finais: nenhum evento os altera.
        if (cached && cached.status !== 'pending') return
        applyOrderUpdate(queryClient, userId, event.data.payload)
      })
    })

    return () => {
      unmounted = true
      setRealtimeConnected(false)
      socket?.removeAllListeners()
      socket?.disconnect()
    }
  }, [queryClient, token])

  return null
}
