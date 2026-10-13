import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useSession } from '@/features/auth/hooks/use-session'
import { nftDetailQueryOptions } from '@/features/catalog/hooks/queries'
import { useToggleFavorite } from '@/features/favorites/hooks/use-favorites'

/**
 * Conclui o favorito que um visitante pediu antes de entrar. O pedido fica na URL
 * (`?favoritar=<id>`) e é executado uma vez, quando a sessão passa a existir.
 */
export function PendingFavorite({ nftId }: { nftId: string }) {
  const navigate = useNavigate()
  const session = useSession()
  const { mutate } = useToggleFavorite()
  const { data: nft } = useQuery(nftDetailQueryOptions(nftId))
  const handled = useRef(false)

  useEffect(() => {
    if (session.status !== 'authenticated' || !nft || handled.current) return
    handled.current = true
    mutate({ nftId: nft.id, nftName: nft.name, favorite: true })
    void navigate({
      to: '.',
      search: (previous) => ({ ...previous, favoritar: undefined }),
      replace: true,
      resetScroll: false,
    })
  }, [session.status, nft, mutate, navigate])

  return null
}
