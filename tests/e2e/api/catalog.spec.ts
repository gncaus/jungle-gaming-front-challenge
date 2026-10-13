import { expect, test } from '@playwright/test'
import Decimal from 'decimal.js'
import { api, openApi } from '../support/api'

interface Summary {
  id: string
  name: string
  price: string
}
interface ListBody {
  items: Summary[]
  page: number
  totalItems: number
  totalPages: number
}

test.beforeEach(async ({ page }) => {
  await openApi(page)
})

test('lista paginada com 36 NFTs em 4 páginas', async ({ page }) => {
  const first = await api<ListBody>(page, 'GET', '/nfts')
  expect(first.status).toBe(200)
  expect(first.body).toMatchObject({ page: 1, totalItems: 36, totalPages: 4 })
  expect(first.body.items).toHaveLength(9)
  expect(first.body.items[0]?.name).toBe('Emerald Ape #042')

  const last = await api<ListBody>(page, 'GET', '/nfts?page=4')
  expect(last.body.items).toHaveLength(9)
  expect(last.body.items.map((item) => item.id)).not.toContain(first.body.items[0]?.id)

  const beyond = await api<ListBody>(page, 'GET', '/nfts?page=9')
  expect(beyond.body.items).toHaveLength(0)
  expect(beyond.body.totalItems).toBe(36)
})

test('filtros combinam coleção, rede, preço e busca', async ({ page }) => {
  const byCollection = await api<ListBody>(page, 'GET', '/nfts?collection=musica')
  expect(byCollection.body.totalItems).toBe(4)

  const withNetwork = await api<ListBody>(page, 'GET', '/nfts?collection=musica&network=solana')
  expect(withNetwork.body.items.map((item) => item.name).sort()).toEqual([
    'Golden Beat #207',
    'Golden Frequency #071',
  ])

  const withPrice = await api<ListBody>(
    page,
    'GET',
    '/nfts?collection=musica&network=solana&maxPrice=0.6',
  )
  expect(withPrice.body.items.map((item) => item.name)).toEqual(['Golden Frequency #071'])

  const twoCollections = await api<ListBody>(page, 'GET', '/nfts?collection=musica&collection=jogos')
  expect(twoCollections.body.totalItems).toBe(8)

  const search = await api<ListBody>(page, 'GET', '/nfts?q=golden')
  expect(search.body.totalItems).toBe(3)

  // A busca ignora acentos e também olha o nome da coleção.
  const accent = await api<ListBody>(page, 'GET', '/nfts?q=MUSICA')
  expect(accent.body.totalItems).toBe(4)

  const nothing = await api<ListBody>(page, 'GET', '/nfts?q=inexistente')
  expect(nothing.body).toMatchObject({ items: [], totalItems: 0, totalPages: 0 })
})

test('abas e ordenação', async ({ page }) => {
  const fresh = await api<ListBody>(page, 'GET', '/nfts?tab=new')
  expect(fresh.body.totalItems).toBe(6)

  const trending = await api<ListBody>(page, 'GET', '/nfts?tab=trending')
  expect(trending.body.totalItems).toBe(6)

  const cheapest = await api<ListBody>(page, 'GET', '/nfts?sort=price-asc&pageSize=24')
  expect(cheapest.body.items[0]?.name).toBe('Saffron Loop #312')
  const prices = cheapest.body.items.map((item) => new Decimal(item.price))
  expect(prices.every((price, index) => index === 0 || price.gte(prices[index - 1] ?? 0))).toBe(true)

  const priciest = await api<ListBody>(page, 'GET', '/nfts?sort=price-desc')
  expect(priciest.body.items[0]).toMatchObject({ name: 'Royal Emerald #003', price: '12.3' })
})

test('parâmetro inválido responde 422 com o campo', async ({ page }) => {
  const response = await api<{ code: string; fields: Record<string, string> }>(
    page,
    'GET',
    '/nfts?sort=aleatorio&page=0',
  )
  expect(response.status).toBe(422)
  expect(response.body.code).toBe('VALIDATION_ERROR')
  expect(Object.keys(response.body.fields).sort()).toEqual(['page', 'sort'])
})

test('filtros disponíveis refletem os dados', async ({ page }) => {
  const facets = await api<{
    collections: { id: string; count: number }[]
    networks: { id: string; count: number }[]
    price: { min: string; max: string }
  }>(page, 'GET', '/nfts/facets')

  expect(facets.body.price).toEqual({ min: '0.02', max: '12.3' })
  expect(facets.body.collections).toHaveLength(9)
  expect(facets.body.collections.reduce((total, option) => total + option.count, 0)).toBe(36)
  expect(facets.body.networks.reduce((total, option) => total + option.count, 0)).toBe(36)
})

test('detalhe traz edições e galeria; id inexistente responde 404', async ({ page }) => {
  const detail = await api<{
    name: string
    price: string
    gallery: unknown[]
    editions: { id: string; label: string; price: string; available: number }[]
  }>(page, 'GET', '/nfts/emerald-ape-042')

  expect(detail.status).toBe(200)
  expect(detail.body).toMatchObject({ name: 'Emerald Ape #042', price: '1.19' })
  expect(detail.body.gallery).toHaveLength(4)
  expect(detail.body.editions).toEqual([
    expect.objectContaining({ id: 'unique', label: '1/1', price: '7.14', available: 0 }),
    expect.objectContaining({ id: 'limited-10', label: '1/10', price: '2.975', available: 1 }),
    expect.objectContaining({ id: 'limited-50', label: '1/50', price: '1.19', available: 12 }),
    expect.objectContaining({ id: 'open', label: 'ABERTA', price: '0.595', available: 500 }),
  ])

  const missing = await api<{ code: string }>(page, 'GET', '/nfts/nao-existe')
  expect(missing.status).toBe(404)
  expect(missing.body.code).toBe('NOT_FOUND')
})

test('NFT esgotado aparece marcado na listagem', async ({ page }) => {
  const response = await api<{ items: { name: string; soldOut: boolean }[] }>(
    page,
    'GET',
    '/nfts?q=shadow',
  )
  expect(response.body.items).toEqual([
    expect.objectContaining({ name: 'Shadow Envoy #039', soldOut: true }),
  ])
})
