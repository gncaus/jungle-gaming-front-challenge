import type { DbState } from '@/mocks/db/types'
import { buildCouponFixtures } from '@/mocks/fixtures/coupons'
import { buildNftFixtures } from '@/mocks/fixtures/nfts'
import { buildFavoriteFixtures, buildUserFixtures, buildWalletFixtures } from '@/mocks/fixtures/users'

/** Mude ao alterar o formato de DbState: estados antigos gravados no navegador são descartados. */
export const schemaVersion = 2

/** Estado inicial conhecido. É o que o reset restaura. */
export function buildSeed(): DbState {
  return {
    schemaVersion,
    sequence: 0,
    nfts: buildNftFixtures(),
    users: buildUserFixtures(),
    sessions: [],
    coupons: buildCouponFixtures(),
    favorites: buildFavoriteFixtures(),
    carts: {},
    wallets: buildWalletFixtures(),
    orders: [],
    idempotency: [],
  }
}
