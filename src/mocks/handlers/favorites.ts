import type { Favorites } from '@/features/favorites/schemas'
import { readDb, updateDb } from '@/mocks/db/store'
import { findNft } from '@/mocks/domain/catalog'
import { requireUser } from '@/mocks/domain/session'
import { route } from '@/mocks/handlers/route'

function favoritesOf(userId: string): Favorites {
  return { nftIds: readDb().favorites[userId] ?? [] }
}

export const favoriteHandlers = [
  route<Favorites>('get', '/favorites', ({ request }) => favoritesOf(requireUser(request).id)),

  route<Favorites>('put', '/favorites/:nftId', ({ request, param }) => {
    const user = requireUser(request)
    const nft = findNft(readDb(), param('nftId'))
    updateDb((state) => {
      const current = state.favorites[user.id] ?? []
      state.favorites[user.id] = current.includes(nft.id) ? current : [...current, nft.id]
    })
    return favoritesOf(user.id)
  }),

  route<Favorites>('delete', '/favorites/:nftId', ({ request, param }) => {
    const user = requireUser(request)
    const nftId = param('nftId')
    updateDb((state) => {
      state.favorites[user.id] = (state.favorites[user.id] ?? []).filter((id) => id !== nftId)
    })
    return favoritesOf(user.id)
  }),
]
