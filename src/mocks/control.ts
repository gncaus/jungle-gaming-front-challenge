import type { MockControl } from '@/mocks/control-types'
import { markNftChanged } from '@/mocks/db/changes'
import { resetDb, updateDb } from '@/mocks/db/store'
import { findEdition, findNft } from '@/mocks/domain/catalog'
import { getScenarioName, setScenario } from '@/mocks/scenarios/state'
import {
  disconnectSockets,
  emittedEvents,
  replayEvent,
  resetSocketServer,
  setSocketAvailable,
} from '@/mocks/socket/server'

const control: MockControl = {
  reset() {
    resetDb()
    setScenario('default')
    resetSocketServer()
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
      markNftChanged(nft)
    })
  },
  getEmittedEvents: () =>
    emittedEvents().map(({ id, type, resourceId, version }) => ({ id, type, resourceId, version })),
  replayEvent,
  disconnectSockets,
  setSocketAvailable,
}

export function installMockControl(): void {
  window.__mockControl = control
}
