import { expect, test } from '@playwright/test'
import { openApp, users } from './support/api'
import { expectTotals, figmaCart, seedCart } from './support/cart'
import { expectResults } from './support/catalog'
import { signIn } from './support/session'
import { settlePage } from './support/visual'

/**
 * Regressão visual. As imagens de referência ficam ao lado deste arquivo e foram geradas
 * no Windows; em outro sistema a renderização de fonte difere e é preciso regerá-las
 * com `npm run test:e2e -- visual --update-snapshots`.
 */
test('página inicial', async ({ page }) => {
  await openApp(page)
  await expectResults(page, 36)
  await settlePage(page)

  await expect(page).toHaveScreenshot('inicio.png', { fullPage: true })
})

test('detalhe do NFT', async ({ page }) => {
  await openApp(page, '/nft/emerald-ape-042')
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Mais desta coleção' }).getByRole('article')).toHaveCount(3)
  await settlePage(page)

  await expect(page).toHaveScreenshot('detalhe.png', { fullPage: true })
})

test('carrinho', async ({ page }) => {
  await openApp(page, '/carrinho')
  await seedCart(page, figmaCart)
  await page.reload()
  await expectTotals(page, { subtotal: '26.83', total: '26.846' })
  await expect(page.getByRole('region', { name: 'Colecionadores também viram' }).getByRole('article')).toHaveCount(5)
  await settlePage(page)

  await expect(page).toHaveScreenshot('carrinho.png', { fullPage: true })
})

test('pagamento', async ({ page, isMobile }) => {
  await openApp(page, '/carrinho')
  await seedCart(page, figmaCart)
  await page.reload()
  await signIn(page, isMobile, users.ana)
  await page.goto('/pagamento')
  await expectTotals(page, { subtotal: '26.83', total: '26.846' })
  await settlePage(page)

  await expect(page).toHaveScreenshot('pagamento.png', { fullPage: true })
})
