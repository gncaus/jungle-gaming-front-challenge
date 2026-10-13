import { expect, type Page } from '@playwright/test'
import { api, openApp, users } from './api'
import { expectTotals, seedCart } from './cart'
import { signIn, storedToken } from './session'

export const confirmButton = (page: Page) => page.getByRole('button', { name: 'Confirmar compra' })
export const connectionState = (page: Page) => page.getByTestId('wallet-connection-state')
export const receiptTitle = 'Seus NFTs agora estão na sua carteira'

/** A simulação resolve o pagamento 3 s depois de criar o pedido. */
export const settled = { timeout: 12_000 }

/** Ana com 2 Emerald Ape no carrinho, na tela de pagamento. */
export async function goToCheckout(page: Page, isMobile: boolean, options: { connect?: boolean } = {}) {
  await openApp(page, '/carrinho')
  await seedCart(page, [['emerald-ape-042', 2]])
  await page.reload()
  await signIn(page, isMobile, users.ana)
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL('/pagamento')
  await expectTotals(page, { subtotal: '2.38', total: '2.396' })
  if (options.connect !== false) {
    await page.getByRole('button', { name: 'Conectar carteira' }).click()
    await expect(connectionState(page)).toHaveText('Carteira conectada')
  }
}

export async function orderCount(page: Page): Promise<number> {
  const token = (await storedToken(page)) ?? ''
  const response = await api<{ items: unknown[] }>(page, 'GET', '/orders', { token })
  return response.body.items.length
}
