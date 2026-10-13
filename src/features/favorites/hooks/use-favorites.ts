import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/use-session'
import {
  addFavorite,
  fetchFavoriteNfts,
  fetchFavorites,
  removeFavorite,
} from '@/features/favorites/api/favorites-api'
import type { Favorites } from '@/features/favorites/schemas'
import { privateKey } from '@/shared/lib/query-keys'
import { announce } from '@/shared/lib/announce'

export const favoriteKeys = {
  list: (userId: string) => privateKey(userId, 'favorites'),
  /** Fica sob a chave da lista, então é revalidada junto com ela a cada mudança. */
  nfts: (userId: string) => privateKey(userId, 'favorites', 'nfts'),
}

/** Favoritos do usuário da sessão. Para visitantes, a consulta nem é feita. */
export function useFavorites() {
  const { user } = useSession()
  return useQuery({
    queryKey: favoriteKeys.list(user?.id ?? ''),
    queryFn: ({ signal }) => fetchFavorites(signal),
    enabled: user !== null,
  })
}

/** Os NFTs favoritados, com os dados do card, para a tela de favoritos. */
export function useFavoriteNfts() {
  const { user } = useSession()
  return useQuery({
    queryKey: favoriteKeys.nfts(user?.id ?? ''),
    queryFn: ({ signal }) => fetchFavoriteNfts(signal),
    enabled: user !== null,
  })
}

interface ToggleInput {
  nftId: string
  nftName: string
  favorite: boolean
}

/**
 * Favorita ou desfavorita com atualização otimista: a tela muda na hora e, se a API falhar,
 * volta ao estado anterior e avisa o usuário. No fim, a lista é revalidada pela API.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const key = favoriteKeys.list(user?.id ?? '')

  return useMutation({
    mutationFn: ({ nftId, favorite }: ToggleInput) => (favorite ? addFavorite(nftId) : removeFavorite(nftId)),
    onMutate: async ({ nftId, favorite }) => {
      // Uma consulta em andamento poderia sobrescrever o estado otimista com dado antigo.
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Favorites>(key)
      const ids = previous?.nftIds ?? []
      queryClient.setQueryData<Favorites>(key, {
        nftIds: favorite ? [...new Set([...ids, nftId])] : ids.filter((id) => id !== nftId),
      })
      return { previous }
    },
    onSuccess: (favorites, { nftName, favorite }) => {
      queryClient.setQueryData(key, favorites)
      announce(favorite ? `${nftName} adicionado aos favoritos.` : `${nftName} removido dos favoritos.`)
    },
    onError: (_error, { nftName, favorite }, context) => {
      queryClient.setQueryData(key, context?.previous)
      announce(
        favorite
          ? `Não foi possível favoritar ${nftName}. Tente novamente.`
          : `Não foi possível remover ${nftName} dos favoritos. Tente novamente.`,
        'error',
      )
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
