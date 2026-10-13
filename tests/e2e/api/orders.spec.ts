import { expect, test, type Page } from '@playwright/test'
import { api, login, mockControl, openApi, reloadApp, setScenario, users } from '../support/api'
import { advanceTime } from '../support/clock'

interface OrderBody {
  id: string
  status: 'pending' | 'confirmed' | 'declined'
  version: number
  receipt: { total: string; subtotal: string; items: { nftId: string; quantity: number; unitPrice: string }[] }
  transaction: { hash: string; explorerUrl: string } | null
  declineReason: string | null
}
interface QuoteBody {
  version: string
  total: string
}
interface ErrorBody {
  code: string
  details?: { quote?: QuoteBody }
}
interface CartBody {
  items: { nftId: string; quantity: number }[]
}

const settleMs = 3100
const edition = 'limited-50'

/** Ana autenticada, com a carteira conectada e 2 Emerald Ape no carrinho. */
async function prepareCheckout(page: Page, options: { connect?: boolean } = {}) {
  const token = await login(page, users.ana)
  if (options.connect !== false) {
    expect((await api(page, 'POST', '/wallets/primary/connect', { token })).status).toBe(200)
  }
  await api(page, 'POST', '/cart/items', {
    token,
    body: { nftId: 'emerald-ape-042', editionId: edition, quantity: 2 },
  })
  const quote = await api<QuoteBody>(page, 'POST', '/quotes', { token, body: {} })
  return { token, quote: quote.body }
}

function placeOrder(page: Page, token: string, key: string, body: Record<string, unknown>) {
  return api<OrderBody & ErrorBody>(page, 'POST', '/orders', {
    token,
    headers: { 'Idempotency-Key': key },
    body: { walletSlot: 'primary', ...body },
  })
}

test.beforeEach(async ({ page }) => {
  await openApi(page)
})

test('compra confirmada: baixa estoque, limpa só o comprado e o recibo não muda', async ({ page }) => {
  const { token, quote } = await prepareCheckout(page)
  expect(quote.total).toBe('2.396')

  const created = await placeOrder(page, token, 'tentativa-1', { quoteVersion: quote.version })
  expect(created.status).toBe(201)
  expect(created.body).toMatchObject({ status: 'pending', version: 1, transaction: null })

  // Item adicionado depois da compra: não faz parte do pedido e precisa continuar no carrinho.
  await api(page, 'POST', '/cart/items', {
    token,
    body: { nftId: 'golden-beat-207', editionId: edition, quantity: 1 },
  })
  await api(page, 'POST', '/cart/items', {
    token,
    body: { nftId: 'emerald-ape-042', editionId: edition, quantity: 1 },
  })

  await advanceTime(page, settleMs)

  const confirmed = await api<OrderBody>(page, 'GET', `/orders/${created.body.id}`, { token })
  expect(confirmed.body).toMatchObject({ status: 'confirmed', version: 2, declineReason: null })
  expect(confirmed.body.transaction?.hash).toMatch(/^0x[0-9a-f]{64}$/)
  expect(confirmed.body.transaction?.explorerUrl).toContain('etherscan.io/tx/0x')

  const cart = await api<CartBody>(page, 'GET', '/cart', { token })
  expect(cart.body.items.map((item) => [item.nftId, item.quantity])).toEqual([
    ['emerald-ape-042', 1],
    ['golden-beat-207', 1],
  ])

  const detail = await api<{ editions: { id: string; available: number }[] }>(
    page,
    'GET',
    '/nfts/emerald-ape-042',
  )
  expect(detail.body.editions.find((item) => item.id === edition)?.available).toBe(10)

  // O recibo é um snapshot: mudar o preço no catálogo não o altera.
  await mockControl(page, 'updateEdition', { nftId: 'emerald-ape-042', editionId: edition, price: '9.99' })
  await advanceTime(page, settleMs)
  const later = await api<OrderBody>(page, 'GET', `/orders/${created.body.id}`, { token })
  expect(later.body).toMatchObject({ status: 'confirmed', version: 2 })
  expect(later.body.receipt).toMatchObject({ subtotal: '2.38', total: '2.396' })
  expect(later.body.receipt.items[0]).toMatchObject({ unitPrice: '1.19', quantity: 2 })
})

test('mesma chave recupera o mesmo pedido; conteúdo diferente gera conflito', async ({ page }) => {
  const { token, quote } = await prepareCheckout(page)

  const first = await placeOrder(page, token, 'chave-a', { quoteVersion: quote.version })
  const repeated = await placeOrder(page, token, 'chave-a', { quoteVersion: quote.version })
  expect([first.status, repeated.status]).toEqual([201, 200])
  expect(repeated.body.id).toBe(first.body.id)

  const different = await placeOrder(page, token, 'chave-a', {
    quoteVersion: quote.version,
    note: 'outro conteúdo',
  })
  expect([different.status, different.body.code]).toEqual([409, 'IDEMPOTENCY_CONFLICT'])

  const withoutKey = await api<ErrorBody>(page, 'POST', '/orders', {
    token,
    body: { walletSlot: 'primary', quoteVersion: quote.version },
  })
  expect(withoutKey.status).toBe(422)

  const list = await api<{ items: OrderBody[] }>(page, 'GET', '/orders', { token })
  expect(list.body.items).toHaveLength(1)
})

test('timeout após criar o pedido: reenviar com a mesma chave não duplica a compra', async ({ page }) => {
  const { token, quote } = await prepareCheckout(page)
  await setScenario(page, 'order-timeout')

  const lost = await placeOrder(page, token, 'chave-timeout', { quoteVersion: quote.version })
  expect(lost.status).toBe(0)

  const retried = await placeOrder(page, token, 'chave-timeout', { quoteVersion: quote.version })
  expect(retried.status).toBe(200)
  expect(retried.body.status).toBe('pending')

  const list = await api<{ items: OrderBody[] }>(page, 'GET', '/orders', { token })
  expect(list.body.items.map((order) => order.id)).toEqual([retried.body.id])
})

test('pedido pendente sobrevive a refresh e é resolvido uma única vez', async ({ page }) => {
  const { token, quote } = await prepareCheckout(page)
  const created = await placeOrder(page, token, 'chave-refresh', { quoteVersion: quote.version })

  await reloadApp(page)
  const pending = await api<{ items: OrderBody[] }>(page, 'GET', '/orders', { token })
  expect(pending.body.items).toEqual([expect.objectContaining({ id: created.body.id, status: 'pending' })])

  await advanceTime(page, settleMs)
  await reloadApp(page)
  await advanceTime(page, settleMs)

  const settled = await api<{ items: OrderBody[] }>(page, 'GET', '/orders', { token })
  expect(settled.body.items).toEqual([
    expect.objectContaining({ id: created.body.id, status: 'confirmed', version: 2 }),
  ])
})

test('pagamento recusado: pedido termina recusado e o carrinho é preservado', async ({ page }) => {
  await setScenario(page, 'payment-declined')
  const { token, quote } = await prepareCheckout(page)

  const created = await placeOrder(page, token, 'chave-recusa', { quoteVersion: quote.version })
  expect(created.body.status).toBe('pending')

  await advanceTime(page, settleMs)

  const declined = await api<OrderBody>(page, 'GET', `/orders/${created.body.id}`, { token })
  expect(declined.body).toMatchObject({ status: 'declined', version: 2, transaction: null })
  expect(declined.body.declineReason).toBeTruthy()

  const cart = await api<CartBody>(page, 'GET', '/cart', { token })
  expect(cart.body.items).toEqual([expect.objectContaining({ nftId: 'emerald-ape-042', quantity: 2 })])

  // Recusado é terminal: voltar ao cenário padrão e esperar não muda o resultado.
  await setScenario(page, 'default')
  await advanceTime(page, settleMs)
  const later = await api<OrderBody>(page, 'GET', `/orders/${created.body.id}`, { token })
  expect(later.body).toMatchObject({ status: 'declined', version: 2 })
})

test('preço alterado durante a compra exige nova confirmação', async ({ page }) => {
  const { token, quote } = await prepareCheckout(page)
  await setScenario(page, 'price-changed')

  const stale = await placeOrder(page, token, 'chave-preco-1', { quoteVersion: quote.version })
  expect([stale.status, stale.body.code]).toEqual([409, 'QUOTE_STALE'])
  const current = stale.body.details?.quote
  expect(current?.version).not.toBe(quote.version)
  expect(current?.total).toBe('2.634')

  expect((await api<{ items: unknown[] }>(page, 'GET', '/orders', { token })).body.items).toHaveLength(0)

  const confirmed = await placeOrder(page, token, 'chave-preco-2', { quoteVersion: current?.version })
  expect(confirmed.status).toBe(201)
  expect(confirmed.body.receipt.total).toBe('2.634')
})

test('edição esgotada durante a compra bloqueia o pedido', async ({ page }) => {
  const { token, quote } = await prepareCheckout(page)
  await setScenario(page, 'sold-out')

  const blocked = await placeOrder(page, token, 'chave-esgotado', { quoteVersion: quote.version })
  expect([blocked.status, blocked.body.code]).toEqual([409, 'INSUFFICIENT_STOCK'])

  expect((await api<{ items: unknown[] }>(page, 'GET', '/orders', { token })).body.items).toHaveLength(0)
  const cart = await api<CartBody>(page, 'GET', '/cart', { token })
  expect(cart.body.items).toHaveLength(1)
})

test('cotação desatualizada por evento externo também é recusada', async ({ page }) => {
  const { token, quote } = await prepareCheckout(page)
  await mockControl(page, 'updateEdition', { nftId: 'emerald-ape-042', editionId: edition, price: '2' })

  const stale = await placeOrder(page, token, 'chave-externa', { quoteVersion: quote.version })
  expect([stale.status, stale.body.code]).toEqual([409, 'QUOTE_STALE'])
  expect(stale.body.details?.quote?.total).toBe('4.016')
})

test('carteira precisa estar cadastrada e conectada', async ({ page }) => {
  const { token, quote } = await prepareCheckout(page, { connect: false })

  const disconnected = await placeOrder(page, token, 'chave-carteira-1', { quoteVersion: quote.version })
  expect([disconnected.status, disconnected.body.code]).toEqual([409, 'WALLET_NOT_CONNECTED'])

  const missing = await placeOrder(page, token, 'chave-carteira-2', {
    quoteVersion: quote.version,
    walletSlot: 'secondary',
  })
  expect(missing.status).toBe(422)

  await setScenario(page, 'wallet-rejected')
  const rejected = await api<ErrorBody>(page, 'POST', '/wallets/primary/connect', { token })
  expect([rejected.status, rejected.body.code]).toEqual([409, 'WALLET_REJECTED'])

  await setScenario(page, 'default')
  await api(page, 'POST', '/wallets/primary/connect', { token })
  await api(page, 'POST', '/wallets/primary/disconnect', { token })
  const afterDisconnect = await placeOrder(page, token, 'chave-carteira-3', { quoteVersion: quote.version })
  expect(afterDisconnect.body.code).toBe('WALLET_NOT_CONNECTED')
})

test('pedido de outro usuário responde 403; inexistente 404; sem sessão 401', async ({ page }) => {
  const { token, quote } = await prepareCheckout(page)
  const created = await placeOrder(page, token, 'chave-isolamento', { quoteVersion: quote.version })

  const bruno = await login(page, users.bruno)
  const foreign = await api<ErrorBody>(page, 'GET', `/orders/${created.body.id}`, { token: bruno })
  expect([foreign.status, foreign.body.code]).toEqual([403, 'FORBIDDEN'])
  expect((await api<{ items: unknown[] }>(page, 'GET', '/orders', { token: bruno })).body.items).toHaveLength(0)

  expect((await api(page, 'GET', '/orders/ord_999', { token })).status).toBe(404)
  expect((await api(page, 'GET', `/orders/${created.body.id}`)).status).toBe(401)
})
