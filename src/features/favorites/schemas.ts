import { z } from 'zod'

/** Resposta de todas as operações de favoritos: a lista completa do usuário. */
export const favoritesSchema = z.object({
  nftIds: z.array(z.string()),
})
export type Favorites = z.infer<typeof favoritesSchema>
