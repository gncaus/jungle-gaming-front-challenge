import { expect, test, type Page } from '@playwright/test'
import { api, login, mockControl, openApi, users } from '../support/api'
import { advanceTime } from '../support/clock'
import { openSocket, receivedEvents, socketState } from '../support/socket'

const nftId = 'emerald-ape-042'
const edition = 'limited-50'

function summarize(events: { type: string; resourceId: string; version: number }[]) {
  return events.map((event) => `${event.type} ${event.resourceId} v${event.version}`)
}

async function emittedIds(page: Page): Promise<string[]> {
  return page.evaluate(() => (window.__mockControl?.getEmittedEvents() ?? []).map((event) => event.id))
}

test.beforeEach(async ({ page }) => {
  await openApi(page)
})

test('nft.updated chega pelo socket com o envelope completo e bate com o REST', async ({ page }) => {
  await openSocket(page, 'visitante')

  await mockControl(page, 'updateEdition', { nftId, editionId: edition, price: '1.5', available: 3 })

  await expect.poll(async () => (await receivedEvents(page, 'visitante')).length).toBe(1)
  const [event] = await receivedEvents(page, 'visitante')
  expect(event).toMatchObject({
    id: `nft:${nftId}:v2`,
    type: 'nft.updated',
    resource: 'nft',
    resourceId: nftId,
    version: 2,
    payload: { price: '1.5', soldOut: false },
  })
  expect(Date.parse(event?.occurredAt ?? '')).not.toBeNaN()
  expect(event?.payload.editions).toContainEqual(
    expect.objectContaining({ id: edition, price: '1.5', available: 3 }),
  )

  const rest = await api<{ version: number; price: string }>(page, 'GET', `/nfts/${nftId}`)
  expect(rest.body).toMatchObject({ version: 2, price: '1.5' })
})

test('order.updated chega só às conexões do dono do pedido', async ({ page }) => {
  const ana = await login(page, users.ana)
  const bruno = await login(page, users.bruno)
  await openSocket(page, 'ana', ana)
  await openSocket(page, 'bruno', bruno)
  await openSocket(page, 'visitante')

  await api(page, 'POST', '/wallets/primary/connect', { token: ana })
  await api(page, 'POST', '/cart/items', { token: ana, body: { nftId, editionId: edition, quantity: 2 } })
  const quote = await api<{ version: string }>(page, 'POST', '/quotes', { token: ana, body: {} })
  const order = await api<{ id: string }>(page, 'POST', '/orders', {
    token: ana,
    headers: { 'Idempotency-Key': 'tempo-real-1' },
    body: { walletSlot: 'primary', quoteVersion: quote.body.version },
  })
  expect(order.status).toBe(201)

  // Nenhuma requisição depois daqui: quem resolve o pedido é o timer do mock.
  await advanceTime(page, 3100)

  const orderEvent = `order.updated ${order.body.id} v2`
  const stockEvent = `nft.updated ${nftId} v2`
  await expect.poll(async () => summarize(await receivedEvents(page, 'ana')).sort()).toEqual(
    [stockEvent, orderEvent].sort(),
  )
  const anaEvents = await receivedEvents(page, 'ana')
  expect(anaEvents.find((event) => event.type === 'order.updated')?.payload).toMatchObject({
    id: order.body.id,
    status: 'confirmed',
    version: 2,
  })

  // A baixa de estoque é pública; o pedido não.
  expect(summarize(await receivedEvents(page, 'bruno'))).toEqual([stockEvent])
  expect(summarize(await receivedEvents(page, 'visitante'))).toEqual([stockEvent])
})

test('o servidor de socket reentrega duplicatas e eventos antigos', async ({ page }) => {
  await openSocket(page, 'visitante')

  await mockControl(page, 'updateEdition', { nftId, editionId: edition, price: '1.3' })
  await mockControl(page, 'updateEdition', { nftId, editionId: edition, price: '1.4' })
  const [older, newer] = await emittedIds(page)
  expect([older, newer]).toEqual([`nft:${nftId}:v2`, `nft:${nftId}:v3`])

  // Duplicata do evento mais recente e, depois, o evento antigo fora de ordem.
  await mockControl(page, 'replayEvent', newer ?? '')
  await mockControl(page, 'replayEvent', older ?? '')

  await expect.poll(async () => (await receivedEvents(page, 'visitante')).length).toBe(4)
  const events = await receivedEvents(page, 'visitante')
  expect(events.map((event) => [event.id, event.version, event.payload.price])).toEqual([
    [older, 2, '1.3'],
    [newer, 3, '1.4'],
    [newer, 3, '1.4'],
    [older, 2, '1.3'],
  ])
})

test('queda de conexão: o cliente reconecta sozinho', async ({ page }) => {
  await openSocket(page, 'visitante')

  await mockControl(page, 'disconnectSockets')

  await expect
    .poll(async () => {
      const state = await socketState(page, 'visitante')
      return [state.disconnects, state.connects, state.connected]
    })
    .toEqual([1, 2, true])

  await mockControl(page, 'updateEdition', { nftId, editionId: edition, price: '1.25' })
  await expect.poll(async () => summarize(await receivedEvents(page, 'visitante'))).toEqual([
    `nft.updated ${nftId} v2`,
  ])
})

test('evento perdido durante a queda não é reentregue; o REST tem o estado atual', async ({ page }) => {
  await openSocket(page, 'visitante')

  await mockControl(page, 'setSocketAvailable', false)
  await expect.poll(async () => (await socketState(page, 'visitante')).connected).toBe(false)

  await mockControl(page, 'updateEdition', { nftId, editionId: edition, price: '1.75' })

  await mockControl(page, 'setSocketAvailable', true)
  await expect.poll(async () => (await socketState(page, 'visitante')).connected).toBe(true)

  await mockControl(page, 'updateEdition', { nftId: 'golden-beat-207', editionId: edition, available: 5 })
  await expect.poll(async () => summarize(await receivedEvents(page, 'visitante'))).toEqual([
    'nft.updated golden-beat-207 v2',
  ])

  // O que se perdeu só é recuperável reconciliando pela API REST.
  const rest = await api<{ version: number; price: string }>(page, 'GET', `/nfts/${nftId}`)
  expect(rest.body).toMatchObject({ version: 2, price: '1.75' })
})

test('o heartbeat do mock mantém a conexão aberta além do tempo de ping', async ({ page }) => {
  await page.clock.install()
  await openSocket(page, 'visitante')

  // O cliente fecharia a conexão após 30 s sem ping do servidor.
  await page.clock.runFor(70_000)

  const state = await socketState(page, 'visitante')
  expect([state.connected, state.disconnects]).toEqual([true, 0])
})
