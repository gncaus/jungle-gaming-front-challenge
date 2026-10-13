import { favoritesSchema, type Favorites } from '@/features/favorites/schemas'
import { http } from '@/shared/lib/http'

export async function fetchFavorites(signal?: AbortSignal): Promise<Favorites> {
  const { data } = await http.get<unknown>('/favorites', { signal })
  return favoritesSchema.parse(data)
}

export async function addFavorite(nftId: string): Promise<Favorites> {
  const { data } = await http.put<unknown>(`/favorites/${encodeURIComponent(nftId)}`)
  return favoritesSchema.parse(data)
}

export async function removeFavorite(nftId: string): Promise<Favorites> {
  const { data } = await http.delete<unknown>(`/favorites/${encodeURIComponent(nftId)}`)
  return favoritesSchema.parse(data)
}
