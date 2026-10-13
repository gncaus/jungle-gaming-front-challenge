import { useQueryClient, type Query } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { Socket } from 'socket.io-client'
import { connectRealtime } from '@/app/socket'
import { useToken } from '@/features/auth/hooks/use-session'
import { catalogKeys } from '@/features/catalog/hooks/queries'
import { nftUpdatedEventSchema } from '@/features/realtime/schemas'

/**
 * Consultas cujo conteúdo depende de preço e disponibilidade dos NFTs: todo o catálogo,
 * o carrinho e a cotação (as duas últimas ficam sob a chave privada do dono).
 */
function dependsOnNfts(query: Query): boolean {
  const [root, , resource] = query.queryKey
  return root === catalogKeys.all[0] || (root === 'private' && (resource === 'cart' || resource === 'quote'))
}

/**
 * Mantém a conexão de tempo real enquanto a aplicação está aberta.
 *
 * A conexão pertence à sessão: quando o token muda (login, logout, expiração), a conexão
 * anterior é encerrada com seus listeners e outra é aberta com a identidade nova. Assim
 * um evento endereçado ao usuário anterior nunca chega a quem entrou depois.
 *
 * Quando o preço ou a disponibilidade de um NFT muda, catálogo, carrinho e cotação são
 * revalidados pela API REST, que é a fonte do estado exibido.
 */
export function RealtimeBridge() {
  const queryClient = useQueryClient()
  const token = useToken()

  useEffect(() => {
    let socket: Socket | undefined
    let unmounted = false

    void connectRealtime(token ?? undefined).then((connected) => {
      if (unmounted) {
        connected.disconnect()
        return
      }
      socket = connected
      // Eventos emitidos enquanto não havia conexão (antes da primeira ou durante uma queda)
      // não são reentregues. A cada conexão, o que está na tela é reconciliado pela API REST.
      // `cancelRefetch: false` evita refazer uma consulta que já está em andamento.
      socket.on('connect', () => {
        void queryClient.invalidateQueries({ predicate: dependsOnNfts }, { cancelRefetch: false })
      })
      socket.on('nft.updated', (data: unknown) => {
        if (nftUpdatedEventSchema.safeParse(data).success) {
          void queryClient.invalidateQueries({ predicate: dependsOnNfts })
        }
      })
    })

    return () => {
      unmounted = true
      socket?.removeAllListeners()
      socket?.disconnect()
    }
  }, [queryClient, token])

  return null
}
