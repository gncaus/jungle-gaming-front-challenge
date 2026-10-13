import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import { socketPath, type RealtimeEvent } from '@/features/realtime/schemas'
import { setChangePublisher, type ResourceChange } from '@/mocks/db/changes'
import { readDb } from '@/mocks/db/store'
import type { DbState } from '@/mocks/db/types'
import { toDetail } from '@/mocks/domain/catalog'
import { toOrder } from '@/mocks/domain/orders'

/**
 * Servidor Socket.IO simulado sobre a interceptação de WebSocket do MSW.
 *
 * O binding codifica e decodifica os pacotes do protocolo, mas não implementa salas,
 * broadcast nem heartbeat. Por isso este módulo guarda as conexões abertas, decide o
 * destino de cada evento e envia os pings que o cliente espera do servidor.
 */
const link = ws.link(`*${socketPath}`)

interface Connection {
  io: ReturnType<typeof toSocketIo>
  close(): void
  /** `null` enquanto a conexão for de visitante. */
  userId: string | null
}

/** Mudanças de NFT vão para todos; mudanças de pedido, só para as conexões do dono. */
type Audience = 'everyone' | { userId: string }

interface Emission {
  event: RealtimeEvent
  audience: Audience
}

/** Menor que o `pingInterval` + `pingTimeout` (30 s) que o binding anuncia no handshake. */
const heartbeatMs = 20_000
const enginePing = '2'
const connectPacketPrefix = '40'
const maxLoggedEmissions = 100

const connections = new Map<string, Connection>()
let emissions: Emission[] = []
let available = true

/** O cliente envia `auth` no pacote de conexão do Socket.IO: `40{"token":"..."}`. */
function userIdFromConnectPacket(data: unknown): string | null {
  if (typeof data !== 'string' || !data.startsWith(connectPacketPrefix)) return null

  const payload: unknown = JSON.parse(data.slice(connectPacketPrefix.length) || '{}')
  const token = (payload as { token?: unknown }).token
  const session = readDb().sessions.find(
    (candidate) => candidate.token === token && Date.parse(candidate.expiresAt) > Date.now(),
  )
  return session?.userId ?? null
}

export const socketHandlers = [
  link.addEventListener('connection', (connection) => {
    const { client } = connection
    if (!available) {
      client.close()
      return
    }

    const entry: Connection = {
      io: toSocketIo(connection),
      close: () => client.close(),
      userId: null,
    }
    connections.set(client.id, entry)

    const heartbeat = setInterval(() => client.send(enginePing), heartbeatMs)

    client.addEventListener('message', (event) => {
      entry.userId ??= userIdFromConnectPacket(event.data)
    })
    client.addEventListener('close', () => {
      clearInterval(heartbeat)
      connections.delete(client.id)
    })
  }),
]

function deliver({ event, audience }: Emission): void {
  for (const connection of connections.values()) {
    if (audience === 'everyone' || connection.userId === audience.userId) {
      connection.io.client.emit(event.type, event)
    }
  }
}

/** Monta o evento a partir do estado já gravado do recurso. */
function toEmission(state: DbState, change: ResourceChange): Emission | null {
  const occurredAt = new Date().toISOString()

  if (change.resource === 'nft') {
    const nft = state.nfts.find((candidate) => candidate.id === change.id)
    if (!nft) return null
    const { price, previousPrice, soldOut, editions, version } = toDetail(nft)
    return {
      audience: 'everyone',
      event: {
        id: `nft:${nft.id}:v${version}`,
        type: 'nft.updated',
        resource: 'nft',
        resourceId: nft.id,
        version,
        occurredAt,
        payload: { price, previousPrice, soldOut, editions },
      },
    }
  }

  const order = state.orders.find((candidate) => candidate.id === change.id)
  if (!order) return null
  return {
    audience: { userId: order.userId },
    event: {
      id: `order:${order.id}:v${order.version}`,
      type: 'order.updated',
      resource: 'order',
      resourceId: order.id,
      version: order.version,
      occurredAt,
      payload: toOrder(order),
    },
  }
}

function publish(changes: ResourceChange[]): void {
  const state = readDb()
  for (const change of changes) {
    const emission = toEmission(state, change)
    if (!emission) continue
    emissions = [...emissions, emission].slice(-maxLoggedEmissions)
    deliver(emission)
  }
}

export function startSocketServer(): void {
  setChangePublisher(publish)
}

/** Eventos já emitidos nesta página, do mais antigo para o mais recente. */
export function emittedEvents(): RealtimeEvent[] {
  return emissions.map((emission) => emission.event)
}

/** Reenvia um evento já emitido, sem alterá-lo: simula entrega duplicada ou fora de ordem. */
export function replayEvent(eventId: string): void {
  const emission = emissions.find((candidate) => candidate.event.id === eventId)
  if (!emission) {
    throw new Error(`O evento ${eventId} não foi emitido nesta página`)
  }
  deliver(emission)
}

/** Derruba todas as conexões. O cliente tenta reconectar sozinho. */
export function disconnectSockets(): void {
  for (const connection of [...connections.values()]) {
    connection.close()
  }
}

/** Com `false`, derruba as conexões e recusa novas até voltar a `true`. */
export function setSocketAvailable(next: boolean): void {
  available = next
  if (!next) disconnectSockets()
}

/** Volta ao estado inicial; usado pelo reset do mock. */
export function resetSocketServer(): void {
  emissions = []
  available = true
}
