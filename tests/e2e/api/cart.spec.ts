import { expect, test, type Page } from '@playwright/test'
import { api, login, mockControl, openApi, reloadApp, users } from '../support/api'

interface CartBody {
  items: { id: string; nftId: string; quantity: number; lineTotal: string; status: string }[]
  itemCount: number
  subtotal: string
}
interface ErrorBody {
  code: string
  details?: { items: { maxQuantity: number; available: number }[] }
}
interface QuoteBody {
  version: string
  subtotal: string
  discount: string
  networkFee: string
  total: string
  coupon: { code: string } | null
}

const guestId = 'visitante-teste-1'
const edition = 'limited-50'

/** O carrinho do frame do Figma: 2 Emerald Ape, 6 Violet Nomad e 9 Ivory Baron. */
async function fillFigmaCart(page: Page, identity: { guestId?: string; token?: string }) {
  for (const [nftId, quantity] of [
    ['emerald-ape-042', 2],
    ['violet-nomad-314', 6],
    ['ivory-baron-088', 9],
  ] as const) {
    const response = await api(page, 'POST', '/cart/items', {
      ...identity,
      body: { nftId, editionId: edition, quantity },
    })
    expect(response.status).toBe(201)
  }
}

test.beforeEach(async ({ page }) => {
  await openApi(page)
})

test('visitante adiciona, altera e remove itens; o carrinho sobrevive a refresh', async ({ page }) => {
  await fillFigmaCart(page, { guestId })

  const cart = await api<CartBody>(page, 'GET', '/cart', { guestId })
  expect(cart.body).toMatchObject({ itemCount: 17, subtotal: '26.83' })
  expect(cart.body.items.map((item) => item.lineTotal)).toEqual(['2.38', '8.34', '16.11'])

  // Adicionar o mesmo NFT e edição soma na mesma linha.
  const more = await api<CartBody>(page, 'POST', '/cart/items', {
    guestId,
    body: { nftId: 'emerald-ape-042', editionId: edition, quantity: 1 },
  })
  expect(more.body.items).toHaveLength(3)
  expect(more.body.items[0]?.quantity).toBe(3)

  const itemId = more.body.items[0]?.id ?? ''
  const changed = await api<CartBody>(page, 'PATCH', `/cart/items/${itemId}`, {
    guestId,
    body: { quantity: 1 },
  })
  expect(changed.body.items[0]).toMatchObject({ quantity: 1, lineTotal: '1.19' })

  await reloadApp(page)
  const afterReload = await api<CartBody>(page, 'GET', '/cart', { guestId })
  expect(afterReload.body.itemCount).toBe(16)

  const removed = await api<CartBody>(page, 'DELETE', `/cart/items/${itemId}`, { guestId })
  expect(removed.body.items.map((item) => item.nftId)).toEqual(['violet-nomad-314', 'ivory-baron-088'])

  const other = await api<CartBody>(page, 'GET', '/cart', { guestId: 'outro-visitante' })
  expect(other.body.items).toHaveLength(0)
})

test('quantidade respeita o estoque e o limite por pedido', async ({ page }) => {
  const overLimit = await api<ErrorBody>(page, 'POST', '/cart/items', {
    guestId,
    body: { nftId: 'emerald-ape-042', editionId: edition, quantity: 11 },
  })
  expect(overLimit.status).toBe(409)
  expect(overLimit.body.code).toBe('INSUFFICIENT_STOCK')
  expect(overLimit.body.details?.items[0]).toMatchObject({ maxQuantity: 10, available: 12 })

  const soldOut = await api<ErrorBody>(page, 'POST', '/cart/items', {
    guestId,
    body: { nftId: 'emerald-ape-042', editionId: 'unique', quantity: 1 },
  })
  expect(soldOut.status).toBe(409)

  const invalid = await api<ErrorBody>(page, 'POST', '/cart/items', {
    guestId,
    body: { nftId: 'emerald-ape-042', editionId: edition, quantity: 1.5 },
  })
  expect(invalid.status).toBe(422)

  const unknownEdition = await api<ErrorBody>(page, 'POST', '/cart/items', {
    guestId,
    body: { nftId: 'emerald-ape-042', editionId: 'nao-existe', quantity: 1 },
  })
  expect(unknownEdition.status).toBe(404)
})

test('itens do visitante são mesclados ao autenticar e ficam isolados por usuário', async ({ page }) => {
  const ana = await login(page, users.ana)
  await api(page, 'POST', '/cart/items', {
    token: ana,
    body: { nftId: 'emerald-ape-042', editionId: edition, quantity: 9 },
  })
  await api(page, 'POST', '/auth/logout', { token: ana })

  await api(page, 'POST', '/cart/items', {
    guestId,
    body: { nftId: 'emerald-ape-042', editionId: edition, quantity: 4 },
  })
  await api(page, 'POST', '/cart/items', {
    guestId,
    body: { nftId: 'golden-beat-207', editionId: edition, quantity: 2 },
  })

  const anaAgain = await login(page, users.ana, { guestId })
  const merged = await api<CartBody>(page, 'GET', '/cart', { token: anaAgain })
  // 9 + 4 passaria do limite de 10 por pedido, então a soma é limitada.
  expect(merged.body.items.map((item) => [item.nftId, item.quantity])).toEqual([
    ['emerald-ape-042', 10],
    ['golden-beat-207', 2],
  ])

  const guestAfter = await api<CartBody>(page, 'GET', '/cart', { guestId })
  expect(guestAfter.body.items).toHaveLength(0)

  const bruno = await login(page, users.bruno)
  const brunoCart = await api<CartBody>(page, 'GET', '/cart', { token: bruno })
  expect(brunoCart.body.items).toHaveLength(0)
})

test('cotação calcula subtotal, taxa de rede e total como no layout', async ({ page }) => {
  await fillFigmaCart(page, { guestId })

  const quote = await api<QuoteBody>(page, 'POST', '/quotes', { guestId, body: {} })
  expect(quote.status).toBe(200)
  expect(quote.body).toMatchObject({
    subtotal: '26.83',
    discount: '0',
    networkFee: '0.016',
    total: '26.846',
    coupon: null,
  })

  const again = await api<QuoteBody>(page, 'POST', '/quotes', { guestId, body: {} })
  expect(again.body.version).toBe(quote.body.version)
})

test('cupom válido aplica desconto; inválido, expirado e abaixo do mínimo são recusados', async ({ page }) => {
  await api(page, 'POST', '/cart/items', {
    guestId,
    body: { nftId: 'emerald-ape-042', editionId: edition, quantity: 2 },
  })

  const discounted = await api<QuoteBody>(page, 'POST', '/quotes', {
    guestId,
    body: { couponCode: 'kurio10' },
  })
  expect(discounted.body).toMatchObject({
    subtotal: '2.38',
    discount: '0.238',
    total: '2.158',
    coupon: { code: 'KURIO10' },
  })

  const invalid = await api<ErrorBody>(page, 'POST', '/quotes', { guestId, body: { couponCode: 'NADA' } })
  expect([invalid.status, invalid.body.code]).toEqual([422, 'COUPON_INVALID'])

  const expired = await api<ErrorBody>(page, 'POST', '/quotes', {
    guestId,
    body: { couponCode: 'VERAO2025' },
  })
  expect([expired.status, expired.body.code]).toEqual([422, 'COUPON_EXPIRED'])

  const belowMinimum = await api<ErrorBody>(page, 'POST', '/quotes', {
    guestId,
    body: { couponCode: 'GENESIS25' },
  })
  expect([belowMinimum.status, belowMinimum.body.code]).toEqual([422, 'COUPON_INVALID'])
})

test('mudança de preço e de estoque altera o carrinho e a versão da cotação', async ({ page }) => {
  await api(page, 'POST', '/cart/items', {
    guestId,
    body: { nftId: 'emerald-ape-042', editionId: edition, quantity: 4 },
  })
  const before = await api<QuoteBody>(page, 'POST', '/quotes', { guestId, body: {} })

  await mockControl(page, 'updateEdition', { nftId: 'emerald-ape-042', editionId: 'limited-50', price: '1.5' })
  const repriced = await api<QuoteBody>(page, 'POST', '/quotes', { guestId, body: {} })
  expect(repriced.body.subtotal).toBe('6')
  expect(repriced.body.version).not.toBe(before.body.version)

  await mockControl(page, 'updateEdition', { nftId: 'emerald-ape-042', editionId: 'limited-50', available: 3 })
  const cart = await api<CartBody>(page, 'GET', '/cart', { guestId })
  expect(cart.body.items[0]?.status).toBe('insufficient-stock')

  const blocked = await api<ErrorBody>(page, 'POST', '/quotes', { guestId, body: {} })
  expect([blocked.status, blocked.body.code]).toEqual([409, 'INSUFFICIENT_STOCK'])
  expect(blocked.body.details?.items[0]).toMatchObject({ available: 3, maxQuantity: 3 })
})

test('carrinho vazio e requisição sem identificação são recusados', async ({ page }) => {
  const empty = await api<ErrorBody>(page, 'POST', '/quotes', { guestId, body: {} })
  expect(empty.status).toBe(422)

  const anonymous = await api<ErrorBody>(page, 'GET', '/cart')
  expect(anonymous.status).toBe(422)
})
