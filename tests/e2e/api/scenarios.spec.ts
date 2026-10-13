import { expect, test } from '@playwright/test'
import { api, login, mockControl, openApi, setScenario, users, waitForApp } from '../support/api'

interface ErrorBody {
  code: string
}
interface ListBody {
  items: { name: string }[]
  totalItems: number
}

test.beforeEach(async ({ page }) => {
  await openApi(page)
})

test('catálogo vazio', async ({ page }) => {
  await setScenario(page, 'empty-catalog')

  const list = await api<ListBody>(page, 'GET', '/nfts')
  expect(list.body).toMatchObject({ items: [], totalItems: 0 })

  const facets = await api<{ price: { min: string; max: string } }>(page, 'GET', '/nfts/facets')
  expect(facets.body.price).toEqual({ min: '0', max: '0' })
})

test('erro de servidor responde 500 no contrato de erro', async ({ page }) => {
  await setScenario(page, 'server-error')

  const response = await api<ErrorBody>(page, 'GET', '/nfts')
  expect(response.status).toBe(500)
  expect(response.body.code).toBe('INTERNAL_ERROR')
})

test('falha de conexão rejeita a requisição', async ({ page }) => {
  await setScenario(page, 'offline')

  expect((await api(page, 'GET', '/nfts')).status).toBe(0)
})

test('falha transitória se recupera na terceira tentativa', async ({ page }) => {
  await setScenario(page, 'flaky')

  const statuses = []
  for (let attempt = 0; attempt < 3; attempt += 1) {
    statuses.push((await api(page, 'GET', '/nfts')).status)
  }
  expect(statuses).toEqual([503, 503, 200])
})

test('sessão expirada responde 401 em recurso privado e não afeta o público', async ({ page }) => {
  const token = await login(page, users.ana)
  await setScenario(page, 'session-expired')

  const privateCall = await api<ErrorBody>(page, 'GET', '/favorites', { token })
  expect([privateCall.status, privateCall.body.code]).toEqual([401, 'SESSION_EXPIRED'])

  expect((await api(page, 'GET', '/nfts')).status).toBe(200)
})

test('falha em favoritos atinge só as mutations', async ({ page }) => {
  const token = await login(page, users.ana)
  await setScenario(page, 'favorites-failure')

  expect((await api(page, 'PUT', '/favorites/golden-beat-207', { token })).status).toBe(500)

  const list = await api<{ nftIds: string[] }>(page, 'GET', '/favorites', { token })
  expect(list.status).toBe(200)
  expect(list.body.nftIds).not.toContain('golden-beat-207')
})

test('latência lenta atrasa a resposta em 2 segundos', async ({ page }) => {
  await page.clock.install()
  await setScenario(page, 'slow')

  const pending = api(page, 'GET', '/nfts')
  let settled = false
  void pending.then(() => {
    settled = true
  })

  await page.clock.runFor(1900)
  expect(settled).toBe(false)

  await page.clock.runFor(200)
  expect((await pending).status).toBe(200)
})

test('respostas do catálogo chegam fora de ordem', async ({ page }) => {
  await setScenario(page, 'out-of-order')

  const order = await page.evaluate(async () => {
    const arrived: string[] = []
    const request = (query: string) =>
      fetch(`/api/nfts?q=${query}`).then(() => {
        arrived.push(query)
      })
    await Promise.all([request('golden'), request('emerald')])
    return arrived
  })

  // A primeira consulta enviada é a lenta, então chega depois da segunda.
  expect(order).toEqual(['emerald', 'golden'])
})

test('cenário escolhido pela URL persiste após refresh', async ({ page }) => {
  await page.goto('/?scenario=empty-catalog')
  await waitForApp(page)
  expect((await api<ListBody>(page, 'GET', '/nfts')).body.totalItems).toBe(0)

  await page.goto('/')
  await waitForApp(page)
  expect((await api<ListBody>(page, 'GET', '/nfts')).body.totalItems).toBe(0)

  await page.goto('/?scenario=default')
  await waitForApp(page)
  expect((await api<ListBody>(page, 'GET', '/nfts')).body.totalItems).toBe(36)
})

test('reset restaura o banco e o cenário por completo', async ({ page }) => {
  const token = await login(page, users.ana)
  await api(page, 'DELETE', '/favorites/neon-vessel-552', { token })
  await api(page, 'POST', '/cart/items', {
    token,
    body: { nftId: 'golden-beat-207', editionId: 'limited-50', quantity: 3 },
  })
  await mockControl(page, 'updateEdition', { nftId: 'emerald-ape-042', editionId: 'limited-50', price: '9.99' })
  await setScenario(page, 'empty-catalog')

  await mockControl(page, 'reset')

  const list = await api<ListBody & { items: { price: string }[] }>(page, 'GET', '/nfts')
  expect(list.body.totalItems).toBe(36)
  expect(list.body.items[0]).toMatchObject({ name: 'Emerald Ape #042', price: '1.19' })

  // As sessões também voltam ao estado inicial: o token antigo deixa de valer.
  expect((await api(page, 'GET', '/favorites', { token })).status).toBe(401)

  const fresh = await login(page, users.ana)
  const favorites = await api<{ nftIds: string[] }>(page, 'GET', '/favorites', { token: fresh })
  expect(favorites.body.nftIds).toEqual(['neon-vessel-552', 'royal-emerald-003'])
  const cart = await api<{ items: unknown[] }>(page, 'GET', '/cart', { token: fresh })
  expect(cart.body.items).toHaveLength(0)
})
