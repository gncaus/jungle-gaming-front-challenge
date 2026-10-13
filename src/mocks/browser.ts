import { setupWorker } from 'msw/browser'
import { installMockControl } from '@/mocks/control'
import { schedulePendingSettlements } from '@/mocks/domain/orders'
import { handlers } from '@/mocks/handlers'
import { applyScenarioFromUrl } from '@/mocks/scenarios/state'
import { socketHandlers, startSocketServer } from '@/mocks/socket/server'

const worker = setupWorker(...handlers, ...socketHandlers)

export async function startMockWorker() {
  applyScenarioFromUrl()
  installMockControl()
  startSocketServer()
  schedulePendingSettlements()
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
  })
}
