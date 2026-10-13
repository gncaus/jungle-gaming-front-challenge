import type { MockControl } from '@/mocks/control-types'
import { resetDb, updateDb } from '@/mocks/db/store'
import { findEdition, findNft } from '@/mocks/domain/catalog'
import { getScenarioName, setScenario } from '@/mocks/scenarios/state'

const control: MockControl = {
  reset() {
    resetDb()
    setScenario('default')
  },
  getScenario: getScenarioName,
  setScenario,
  expireSessions() {
    updateDb((state) => {
      const expired = new Date(0).toISOString()
      for (const session of state.sessions) {
        session.expiresAt = expired
      }
    })
  },
  updateEdition({ nftId, editionId, price, available }) {
    updateDb((state) => {
      const nft = findNft(state, nftId)
      const edition = findEdition(nft, editionId)
      if (price !== undefined) edition.price = price
      if (available !== undefined) edition.available = available
      nft.version += 1
    })
  },
}

export function installMockControl(): void {
  window.__mockControl = control
}
