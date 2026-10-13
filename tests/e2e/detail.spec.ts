import { expect, test, type Page } from '@playwright/test'
import { mockControl, openApp } from './support/api'

const emeraldApe = '/nft/emerald-ape-042'

/** O preço aparece em lugares diferentes no mobile e em telas largas; só um fica visível. */
function price(page: Page) {
  return page.locator('[data-testid="edition-price"]:visible')
}

function edition(page: Page, label: string) {
  // Nome exato, com ou sem a marca de esgotada: "1/1" não pode casar com "1/10".
  return page.getByRole('radio', { name: new RegExp(`^${label}( \\(esgotada\\))?$`) })
}

const quantity = (page: Page) => page.getByRole('group', { name: /^Quantidade de / })

test('acesso direto mostra o NFT com galeria, edições e informações', async ({ page }) => {
  await openApp(page, emeraldApe)

  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  await expect(price(page)).toContainText('1.19 ETH')
  await expect(page.getByRole('radio')).toHaveCount(4)
  await expect(edition(page, '1/50')).toBeChecked()
  await expect(page.getByText('#0042')).toBeVisible()
  await expect(page.getByText('Óculos, Esmeralda, Comum')).toBeVisible()

  const gallery = page.getByRole('list', { name: 'Imagens do NFT' })
  await expect(gallery.getByRole('button')).toHaveCount(4)
  await expect(page.getByRole('img', { name: /Emerald Ape #042.*arte completa/ })).toBeVisible()

  await gallery.getByRole('button', { name: 'Ver imagem 2 de 4' }).click()
  await expect(page.getByRole('img', { name: /Emerald Ape #042.*detalhe do rosto/ })).toBeVisible()
  await expect(gallery.getByRole('button', { name: 'Ver imagem 2 de 4' })).toHaveAttribute('aria-current', 'true')
})

test('trocar de edição muda o preço, vai para a URL e sobrevive a refresh', async ({ page }) => {
  await openApp(page, emeraldApe)

  await edition(page, 'ABERTA').check()
  await expect(price(page)).toContainText('0.595 ETH')
  await expect(page).toHaveURL(/edicao=open/)

  await page.reload()
  await expect(edition(page, 'ABERTA')).toBeChecked()
  await expect(price(page)).toContainText('0.595 ETH')

  // Edição esgotada continua na lista, mas não pode ser escolhida.
  await expect(edition(page, '1/1')).toBeDisabled()
  await expect(edition(page, '1/1')).toHaveAccessibleName(/esgotada/)
})

test('quantidade respeita o limite por pedido e o estoque da edição', async ({ page }) => {
  await openApp(page, emeraldApe)
  const stepper = quantity(page)
  const more = stepper.getByRole('button', { name: 'Aumentar quantidade' })
  const less = stepper.getByRole('button', { name: 'Diminuir quantidade' })

  await expect(less).toBeDisabled()
  for (let click = 0; click < 9; click += 1) {
    await more.click()
  }
  await expect(stepper.getByRole('status')).toHaveText('10')
  await expect(more).toBeDisabled()
  await expect(page.getByText('Limite de 10 por pedido nesta edição.')).toBeVisible()

  // A edição 1/10 deste NFT tem uma unidade só; trocar de edição volta a quantidade para 1.
  await edition(page, '1/10').check()
  await expect(stepper.getByRole('status')).toHaveText('1')
  await expect(more).toBeDisabled()
  await expect(page.getByText('Restam 1 unidade desta edição.')).toBeVisible()
})

test('edição esgotada pedida pela URL é sinalizada', async ({ page }) => {
  await openApp(page, `${emeraldApe}?edicao=unique`)

  await expect(page.getByText('A edição 1/1 está esgotada. Escolha outra edição.')).toBeVisible()
  await expect(quantity(page).getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled()
  await expect(price(page)).toContainText('7.14 ETH')
})

test('NFT totalmente esgotado não permite escolher quantidade', async ({ page }) => {
  await openApp(page, '/nft/shadow-envoy-039')

  await expect(page.getByRole('heading', { level: 1, name: 'Shadow Envoy #039' })).toBeVisible()
  await expect(page.getByText(/está esgotada\. Escolha outra edição\./)).toBeVisible()
  for (const option of await page.getByRole('radio').all()) {
    await expect(option).toBeDisabled()
  }
})

test('preço e disponibilidade mudam em tempo real no detalhe', async ({ page }) => {
  await openApp(page, emeraldApe)
  await expect(price(page)).toContainText('1.19 ETH')
  const more = quantity(page).getByRole('button', { name: 'Aumentar quantidade' })
  for (let click = 0; click < 4; click += 1) {
    await more.click()
  }

  await mockControl(page, 'updateEdition', { nftId: 'emerald-ape-042', editionId: 'limited-50', price: '1.5' })
  await expect(price(page)).toContainText('1.50 ETH')

  await mockControl(page, 'updateEdition', { nftId: 'emerald-ape-042', editionId: 'limited-50', available: 3 })
  await expect(page.getByText('A disponibilidade mudou: agora é possível levar no máximo 3.')).toBeVisible()
  await expect(quantity(page).getByRole('status')).toHaveText('3')
})

test('carregamento lento mostra o skeleton do detalhe', async ({ page }) => {
  await openApp(page, `${emeraldApe}?scenario=slow`)

  await expect(page.getByTestId('nft-skeleton')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  await expect(page.getByTestId('nft-skeleton')).toBeHidden()
})

test('falha ao carregar o detalhe permite tentar de novo', async ({ page }) => {
  await openApp(page, `${emeraldApe}?scenario=server-error`)

  const alert = page.getByRole('alert').filter({ hasText: 'Não foi possível carregar o NFT' })
  await expect(alert).toBeVisible({ timeout: 15_000 })

  await mockControl(page, 'setScenario', 'default')
  await alert.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
})

test('abas de informações funcionam pelo teclado', async ({ page }) => {
  await openApp(page, emeraldApe)

  const details = page.getByRole('tab', { name: 'Detalhes do NFT' })
  await expect(details).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tabpanel')).toContainText('Cunhado na Ethereum')

  await details.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: /Avaliações de colecionadores/ })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.getByRole('tabpanel')).toContainText('avaliações de colecionadores')
})

test('"Mais desta coleção" leva a outro NFT e recomeça a seleção', async ({ page }) => {
  await openApp(page, emeraldApe)
  await quantity(page).getByRole('button', { name: 'Aumentar quantidade' }).click()

  const related = page.getByRole('region', { name: 'Mais desta coleção' })
  await expect(related.getByRole('article')).toHaveCount(3)
  await expect(related.getByText('Emerald Ape #042')).toHaveCount(0)

  await related.getByRole('link', { name: /Violet Nomad #314/ }).click()
  await expect(page).toHaveURL(/\/nft\/violet-nomad-314$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Violet Nomad #314' })).toBeVisible()
  await expect(quantity(page).getByRole('status')).toHaveText('1')
})

test('não há overflow horizontal no detalhe', async ({ page }) => {
  await openApp(page, emeraldApe)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBe(0)
})
