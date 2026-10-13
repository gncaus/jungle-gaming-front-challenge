import { z } from 'zod'
import { nftSummarySchema } from '@/features/catalog/schemas'

/** Resposta de todas as operações de favoritos: a lista completa do usuário. */
export const favoritesSchema = z.object({
  nftIds: z.array(z.string()),
})
export type Favorites = z.infer<typeof favoritesSchema>

/** Resposta de `GET /favorites/nfts`: os NFTs favoritados, do mais recente para o mais antigo. */
export const favoriteNftsSchema = z.object({
  items: z.array(nftSummarySchema),
})
export type FavoriteNfts = z.infer<typeof favoriteNftsSchema>
