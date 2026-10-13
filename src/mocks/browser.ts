import { setupWorker } from 'msw/browser'
import { installMockControl, markMockReady } from '@/mocks/control'
import { schedulePendingSettlements } from '@/mocks/domain/orders'
import { handlers } from '@/mocks/handlers'
import { applyScenarioFromUrl } from '@/mocks/scenarios/state'
import { socketHandlers, startSocketServer } from '@/mocks/socket/server'

const worker = setupWorker(...handlers, ...socketHandlers)

export async function startMockWorker(initialSearch: string): Promise<void> {
  applyScenarioFromUrl(initialSearch)
  installMockControl()
  startSocketServer()
  schedulePendingSettlements()
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
  })
  markMockReady()
}
