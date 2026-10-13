import { setupWorker } from 'msw/browser'
import { installMockControl } from '@/mocks/control'
import { handlers } from '@/mocks/handlers'
import { applyScenarioFromUrl } from '@/mocks/scenarios/state'

const worker = setupWorker(...handlers)

export async function startMockWorker() {
  applyScenarioFromUrl()
  installMockControl()
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
  })
}
