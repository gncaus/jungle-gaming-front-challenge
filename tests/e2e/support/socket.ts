import path from 'node:path'
import type { Page } from '@playwright/test'
import type { io as connect, Socket } from 'socket.io-client'

export interface ReceivedEvent {
  id: string
  type: string
  resource: string
  resourceId: string
  version: number
  occurredAt: string
  payload: Record<string, unknown>
}

interface TestSocket {
  socket: Socket
  events: ReceivedEvent[]
  connects: number
  disconnects: number
}

declare global {
  interface Window {
    io?: typeof connect
    __testSockets?: Record<string, TestSocket>
  }
}

/** Build de navegador do socket.io-client: o mesmo cliente real que a aplicação usa. */
const clientScript = path.resolve('node_modules/socket.io-client/dist/socket.io.min.js')

/**
 * Abre na página uma conexão com o socket.io-client real e passa a registrar o que chega.
 * A conexão sai pelo WebSocket da página, que é onde o MSW a intercepta.
 */
export async function openSocket(page: Page, name: string, token?: string): Promise<void> {
  if (!(await page.evaluate(() => typeof window.io === 'function'))) {
    await page.addScriptTag({ path: clientScript })
  }
  await page.evaluate(
    ({ name, token }) =>
      new Promise<void>((resolve) => {
        if (!window.io) throw new Error('socket.io-client não foi carregado na página')
        const socket = window.io({
          path: '/realtime/',
          transports: ['websocket'],
          auth: token ? { token } : {},
          reconnectionDelay: 100,
          reconnectionDelayMax: 200,
        })
        const record: TestSocket = { socket, events: [], connects: 0, disconnects: 0 }
        window.__testSockets = { ...window.__testSockets, [name]: record }

        socket.onAny((_type: string, event: ReceivedEvent) => record.events.push(event))
        socket.on('disconnect', () => {
          record.disconnects += 1
        })
        socket.on('connect', () => {
          record.connects += 1
          resolve()
        })
      }),
    { name, token },
  )
}

export async function socketState(page: Page, name: string) {
  return page.evaluate((socketName) => {
    const record = window.__testSockets?.[socketName]
    if (!record) throw new Error(`Socket de teste "${socketName}" não existe`)
    return {
      connected: record.socket.connected,
      connects: record.connects,
      disconnects: record.disconnects,
      events: record.events,
    }
  }, name)
}

export async function receivedEvents(page: Page, name: string): Promise<ReceivedEvent[]> {
  return (await socketState(page, name)).events
}
