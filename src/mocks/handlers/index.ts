import { authHandlers } from '@/mocks/handlers/auth'
import { cartHandlers } from '@/mocks/handlers/cart'
import { favoriteHandlers } from '@/mocks/handlers/favorites'
import { healthHandlers } from '@/mocks/handlers/health'
import { nftHandlers } from '@/mocks/handlers/nfts'
import { quoteHandlers } from '@/mocks/handlers/quotes'

export const handlers = [
  ...healthHandlers,
  ...authHandlers,
  ...nftHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...quoteHandlers,
]
