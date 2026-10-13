import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { Socket } from 'socket.io-client'
import { connectRealtime } from '@/app/socket'
import { catalogKeys } from '@/features/catalog/hooks/queries'
import { nftUpdatedEventSchema } from '@/features/realtime/schemas'

/**
 * Mantém a conexão de tempo real enquanto a aplicação está aberta.
 * Quando o preço ou a disponibilidade de um NFT muda, as consultas do catálogo são
 * revalidadas pela API REST, que é a fonte do estado exibido.
 */
export function RealtimeBridge() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let socket: Socket | undefined
    let unmounted = false

    void connectRealtime().then((connected) => {
      if (unmounted) {
        connected.disconnect()
        return
      }
      socket = connected
      socket.on('nft.updated', (data: unknown) => {
        if (nftUpdatedEventSchema.safeParse(data).success) {
          void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
        }
      })
    })

    return () => {
      unmounted = true
      socket?.removeAllListeners()
      socket?.disconnect()
    }
  }, [queryClient])

  return null
}
