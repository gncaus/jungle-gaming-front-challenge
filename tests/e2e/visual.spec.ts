import { expect, test } from '@playwright/test'
import { openApp } from './support/api'
import { expectResults } from './support/catalog'
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
