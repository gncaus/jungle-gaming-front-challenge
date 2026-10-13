import {
  createOrderInputSchema,
  idempotencyHeader,
  type Order,
  type OrderList,
} from '@/features/orders/schemas'
import { readDb, updateDb } from '@/mocks/db/store'
import type { OrderRecord } from '@/mocks/db/types'
import { fingerprint } from '@/mocks/domain/hash'
import {
  applyCheckoutInterference,
  createOrder,
  scheduleSettlement,
  toOrder,
} from '@/mocks/domain/orders'
import { requireUser } from '@/mocks/domain/session'
import { MockApiError, MockNetworkError } from '@/mocks/handlers/http-error'
import { Reply, route } from '@/mocks/handlers/route'
import { fireOnce, getScenario } from '@/mocks/scenarios/state'

function findOrder(orderId: string): OrderRecord {
  const order = readDb().orders.find((candidate) => candidate.id === orderId)
  if (!order) {
    throw new MockApiError('NOT_FOUND', 'Pedido não encontrado.')
  }
  return order
}

export const orderHandlers = [
  route<Order>('post', '/orders', async ({ request, body }) => {
    const user = requireUser(request)
    const key = request.headers.get(idempotencyHeader)?.trim()
    if (!key) {
      throw new MockApiError('VALIDATION_ERROR', `Envie o header ${idempotencyHeader}.`)
    }
    const input = await body(createOrderInputSchema)
    const print = fingerprint(input)

    // Mesma chave e mesmo conteúdo: devolve o pedido já criado, sem criar outro.
    const previous = readDb().idempotency.find(
      (record) => record.userId === user.id && record.key === key,
    )
    if (previous) {
      if (previous.fingerprint !== print) {
        throw new MockApiError(
          'IDEMPOTENCY_CONFLICT',
          'Esta chave de idempotência já foi usada com outro conteúdo.',
        )
      }
      return toOrder(findOrder(previous.orderId))
    }

    const order = updateDb((state) => {
      applyCheckoutInterference(state, user.id)
      const created = createOrder(state, user, input)
      state.idempotency.push({ userId: user.id, key, fingerprint: print, orderId: created.id })
      return created
    })
    scheduleSettlement(order)

    if (getScenario().checkout === 'timeout-after-create' && fireOnce('timeout-after-create')) {
      throw new MockNetworkError()
    }
    return new Reply(201, toOrder(order))
  }),

  route<OrderList>('get', '/orders', ({ request }) => {
    const user = requireUser(request)
    const items = readDb()
      .orders.filter((order) => order.userId === user.id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id.localeCompare(a.id))
    return { items: items.map(toOrder) }
  }),

  route<Order>('get', '/orders/:id', ({ request, param }) => {
    const user = requireUser(request)
    const order = findOrder(param('id'))
    if (order.userId !== user.id) {
      throw new MockApiError('FORBIDDEN', 'Este pedido pertence a outra conta.')
    }
    return toOrder(order)
  }),
]
