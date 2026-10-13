import { expect, test } from '@playwright/test'
import { mockControl, openApp } from './support/api'

test('a aplicação conecta ao socket e mostra o evento recebido', async ({ page }) => {
  await openApp(page)
  await expect(page.getByText('Tempo real: conectado')).toBeVisible()

  await mockControl(page, 'updateEdition', {
    nftId: 'emerald-ape-042',
    editionId: 'limited-50',
    price: '1.5',
  })

  await expect(page.getByText('Último evento: nft.updated · emerald-ape-042 · versão 2')).toBeVisible()
})

test('a aplicação mostra a queda e a volta da conexão', async ({ page }) => {
  await openApp(page)
  await expect(page.getByText('Tempo real: conectado')).toBeVisible()

  await mockControl(page, 'setSocketAvailable', false)
  await expect(page.getByText('Tempo real: desconectado')).toBeVisible()

  await mockControl(page, 'setSocketAvailable', true)
  await expect(page.getByText('Tempo real: conectado')).toBeVisible({ timeout: 15_000 })
})
