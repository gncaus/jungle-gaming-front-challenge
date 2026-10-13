import { expect, test, type Page } from '@playwright/test'
import { mockControl, openApp, users } from './support/api'
import { announcer } from './support/cart'
import { confirmButton, goToCheckout, orderCount, receiptTitle, settled } from './support/checkout'
import { signIn } from './support/session'

const emeraldApe = { nftId: 'emerald-ape-042', editionId: 'limited-50' }
const price = (page: Page) => page.locator('[data-testid="edition-price"]:visible')

/** Conta as chamadas à API cujo caminho casa com o padrão, a partir de agora. */
function countRequests(page: Page, pattern: RegExp): () => number {
  let count = 0
  page.on('request', (request) => {
    if (pattern.test(new URL(request.url()).pathname)) count += 1
  })
  return () => count
}

async function emittedIds(page: Page, type: string): Promise<string[]> {
  return page.evaluate(
    (eventType) =>
      (window.__mockControl?.getEmittedEvents() ?? [])
        .filter((event) => event.type === eventType)
        .map((event) => event.id),
    type,
  )
}

test('evento duplicado ou antigo de NFT não refaz consultas nem regride o preço', async ({ page }) => {
  await openApp(page, '/nft/emerald-ape-042')
  await expect(price(page)).toContainText('1.19 ETH')

  await mockControl(page, 'updateEdition', { ...emeraldApe, price: '1.5' })
  await expect(price(page)).toContainText('1.50 ETH')
  await mockControl(page, 'updateEdition', { ...emeraldApe, price: '1.8' })
  await expect(price(page)).toContainText('1.80 ETH')

  const [older, newer] = await emittedIds(page, 'nft.updated')
  const detailRequests = countRequests(page, /^\/api\/nfts\/emerald-ape-042$/)

  // O mais recente de novo (duplicata) e depois o antigo, fora de ordem.
  await mockControl(page, 'replayEvent', newer ?? '')
  await mockControl(page, 'replayEvent', older ?? '')
  await page.waitForTimeout(800)

  expect(detailRequests()).toBe(0)
  await expect(price(page)).toContainText('1.80 ETH')

  // Um evento novo de verdade continua sendo aplicado.
  await mockControl(page, 'updateEdition', { ...emeraldApe, price: '2' })
  await expect(price(page)).toContainText('2.00 ETH')
  expect(detailRequests()).toBeGreaterThan(0)
})

test('a confirmação do pedido chega pelo socket, sem consulta periódica, e não se repete', async ({
  page,
  isMobile,
}) => {
  await goToCheckout(page, isMobile)
  const orderRequests = countRequests(page, /^\/api\/orders\/ord_\d+$/)

  await confirmButton(page).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Processando seu pagamento' })).toBeVisible()

  await expect(page.getByRole('heading', { level: 1, name: receiptTitle })).toBeVisible(settled)
  await expect(announcer(page)).toHaveText('Pagamento confirmado. Seus NFTs estão na sua carteira.')
  // Com o socket conectado, a tela não consultou o pedido na API: o estado veio do evento.
  expect(orderRequests()).toBe(0)

  // O aviso some sozinho; reenviar o mesmo evento não o traz de volta nem muda o pedido.
  await expect(announcer(page)).toBeEmpty({ timeout: 10_000 })
  const [orderEvent] = await emittedIds(page, 'order.updated')
  await mockControl(page, 'replayEvent', orderEvent ?? '')
  await page.waitForTimeout(800)

  await expect(announcer(page)).toBeEmpty()
  await expect(page.getByRole('heading', { level: 1, name: receiptTitle })).toBeVisible()
  expect(await orderCount(page)).toBe(1)
})

test('socket cai com o pedido pendente: o estado é recuperado sem nova compra', async ({ page, isMobile }) => {
  await goToCheckout(page, isMobile)
  await confirmButton(page).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Processando seu pagamento' })).toBeVisible()

  // A conexão cai antes de o pagamento ser resolvido: o evento `order.updated` se perde.
  await mockControl(page, 'setSocketAvailable', false)

  // Sem socket, a tela recorre à API e chega ao mesmo estado.
  await expect(page.getByRole('heading', { level: 1, name: receiptTitle })).toBeVisible(settled)

  await mockControl(page, 'setSocketAvailable', true)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: receiptTitle })).toBeVisible()
  expect(await orderCount(page)).toBe(1)
})

test('recusa do pagamento chega pelo socket', async ({ page, isMobile }) => {
  await goToCheckout(page, isMobile)
  await mockControl(page, 'setScenario', 'payment-declined')

  await confirmButton(page).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Pagamento recusado' })).toBeVisible(settled)
  await expect(announcer(page)).toContainText('Pagamento recusado. Os itens continuam no seu carrinho.')
})

test('evento do pedido de um usuário não chega a quem entra depois', async ({ page, isMobile }) => {
  await goToCheckout(page, isMobile)
  await confirmButton(page).click()
  await expect(page).toHaveURL(/\/pedido\/ord_\d+$/)

  // Ana sai com o pedido ainda pendente e Bruno entra no mesmo navegador.
  await page.goto('/perfil')
  await page.getByRole('main').getByRole('button', { name: 'Sair' }).click()
  await signIn(page, isMobile, users.bruno)

  // O pagamento da Ana é resolvido enquanto Bruno está na página.
  await expect.poll(async () => (await emittedIds(page, 'order.updated')).length, settled).toBe(1)
  await page.waitForTimeout(500)

  await expect(announcer(page)).not.toContainText('Pagamento confirmado')
  expect(await orderCount(page)).toBe(0)
})
