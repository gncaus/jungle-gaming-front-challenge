import { expect, test } from '@playwright/test'
import { mockControl, openApp, setScenario, users } from './support/api'
import {
  announcer,
  cartItem,
  cartTotals,
  expectCartCount,
  expectTotals,
  figmaCart,
  seedCart,
} from './support/cart'
import { catalog } from './support/catalog'
import { signIn } from './support/session'

const more = { name: 'Aumentar quantidade' }
const less = { name: 'Diminuir quantidade' }

test('comprar no detalhe leva ao carrinho com a edição e a quantidade escolhidas', async ({
  page,
  isMobile,
}) => {
  await openApp(page, '/nft/emerald-ape-042')
  await expectCartCount(page, 0)

  await page.getByRole('group', { name: /^Quantidade de / }).getByRole('button', more).click()
  await page
    .getByRole('button', { name: isMobile ? 'Comprar NFT Emerald Ape #042' : 'Comprar Emerald Ape #042' })
    .click()

  await expect(page).toHaveURL('/carrinho')
  const row = cartItem(page, 'Emerald Ape #042')
  await expect(row).toContainText('Edição: 1/50')
  await expect(row.getByRole('group', { name: 'Quantidade de Emerald Ape #042' }).getByRole('status')).toHaveText('2')
  await expectTotals(page, { subtotal: '2.38', total: '2.396' })
  await expectCartCount(page, 2)
})

test('o resumo reproduz os valores do layout e acompanha quantidades e remoções', async ({ page }) => {
  await openApp(page, '/carrinho')
  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  await seedCart(page, figmaCart)
  await page.reload()

  await expect(page.getByTestId('cart-item')).toHaveCount(3)
  await expectTotals(page, { subtotal: '26.83', discount: '0.00', total: '26.846' })
  await expect(cartTotals(page)).toContainText('0.016 ETH')
  await expectCartCount(page, 17)

  const ape = cartItem(page, 'Emerald Ape #042')
  await ape.getByRole('button', more).click()
  await expect(ape.getByRole('status')).toHaveText('3')
  await expect(ape).toContainText('3.57 ETH')
  await expectTotals(page, { subtotal: '28.02', total: '28.036' })

  await ape.getByRole('button', less).click()
  await expectTotals(page, { subtotal: '26.83', total: '26.846' })

  // Ivory Baron está com 9 e o limite por pedido é 10.
  const baron = cartItem(page, 'Ivory Baron #088')
  await baron.getByRole('button', more).click()
  await expect(baron.getByRole('status')).toHaveText('10')
  await expect(baron.getByRole('button', more)).toBeDisabled()

  await cartItem(page, 'Violet Nomad #314').getByRole('button', { name: /^Remover Violet Nomad/ }).click()
  await expect(cartItem(page, 'Violet Nomad #314')).toHaveCount(0)
  await expect(announcer(page)).toHaveText('Violet Nomad #314 removido do carrinho.')
  await expectTotals(page, { subtotal: '20.28', total: '20.296' })

  await page.reload()
  await expect(page.getByTestId('cart-item')).toHaveCount(2)
  await expectTotals(page, { subtotal: '20.28', total: '20.296' })
  await expectCartCount(page, 12)
})

test('cupom: aplicar, manter após refresh, remover e recusar os inválidos', async ({ page }) => {
  await openApp(page, '/carrinho')
  await seedCart(page, [['emerald-ape-042', 2]])
  await page.reload()
  await expectTotals(page, { subtotal: '2.38', discount: '0.00', total: '2.396' })

  const coupon = page.getByRole('textbox', { name: 'Código promocional' })
  const apply = page.getByRole('button', { name: 'Aplicar' })

  await coupon.fill('kurio10')
  await apply.click()
  await expectTotals(page, { subtotal: '2.38', discount: '0.238', total: '2.158' })
  await expect(page.getByText('Cupom KURIO10 aplicado (10% de desconto).')).toBeVisible()
  await expect(page).toHaveURL(/cupom=KURIO10/)

  await page.reload()
  await expectTotals(page, { subtotal: '2.38', discount: '0.238', total: '2.158' })

  await page.getByRole('button', { name: 'Remover cupom' }).click()
  await expectTotals(page, { subtotal: '2.38', discount: '0.00', total: '2.396' })
  await expect(page).not.toHaveURL(/cupom=/)

  for (const [code, message] of [
    ['NADA', 'Código promocional inválido.'],
    ['VERAO2025', 'Este código promocional expirou.'],
    ['GENESIS25', 'Este código vale para compras a partir de 5 ETH.'],
  ] as const) {
    await coupon.fill(code)
    await apply.click()
    await expect(coupon).toHaveAccessibleDescription(message)
    // O resumo continua mostrando os valores sem desconto.
    await expectTotals(page, { subtotal: '2.38', discount: '0.00', total: '2.396' })
    await expect(page).not.toHaveURL(/cupom=/)
  }
})

test('cupom inválido que chega pela URL é sinalizado e pode ser removido', async ({ page }) => {
  await openApp(page, '/carrinho')
  await seedCart(page, [['emerald-ape-042', 2]])
  await page.goto('/carrinho?cupom=VERAO2025')

  const alert = page.getByRole('alert').filter({ hasText: 'O cupom VERAO2025 não pode ser usado' })
  await expect(alert).toContainText('Este código promocional expirou.')

  await alert.getByRole('button', { name: 'Remover cupom' }).click()
  await expectTotals(page, { subtotal: '2.38', total: '2.396' })
})

test('itens do visitante passam para a conta ao entrar e não aparecem para outro usuário', async ({
  page,
  isMobile,
}) => {
  await openApp(page, '/carrinho')
  await seedCart(page, [
    ['emerald-ape-042', 2],
    ['golden-beat-207', 1],
  ])
  await page.reload()
  await expect(page.getByTestId('cart-item')).toHaveCount(2)

  await signIn(page, isMobile, users.ana)
  await expect(page).toHaveURL('/carrinho')
  await expect(page.getByTestId('cart-item')).toHaveCount(2)
  await expectTotals(page, { subtotal: '3.37', total: '3.387' })
  await expectCartCount(page, 3)

  // Depois de sair, o carrinho do visitante é outro, vazio.
  await page.goto('/perfil')
  await page.getByRole('main').getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL('/')
  await expectCartCount(page, 0)

  await signIn(page, isMobile, users.bruno)
  await page.goto('/carrinho')
  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  await expect(page.getByTestId('cart-item')).toHaveCount(0)

  // E o da Ana continua lá quando ela volta.
  await page.goto('/perfil')
  await page.getByRole('main').getByRole('button', { name: 'Sair' }).click()
  await signIn(page, isMobile, users.ana)
  await page.goto('/carrinho')
  await expect(page.getByTestId('cart-item')).toHaveCount(2)
})

test('mudança de preço em tempo real avisa o usuário e atualiza o resumo', async ({ page }) => {
  await openApp(page, '/carrinho')
  await seedCart(page, [['emerald-ape-042', 2]])
  await page.reload()
  await expectTotals(page, { subtotal: '2.38', total: '2.396' })

  await mockControl(page, 'updateEdition', { nftId: 'emerald-ape-042', editionId: 'limited-50', price: '1.5' })

  const notice = 'O preço de Emerald Ape #042 mudou de 1.19 ETH para 1.50 ETH.'
  await expect(cartItem(page, 'Emerald Ape #042')).toContainText(notice)
  await expect(announcer(page)).toHaveText(notice)
  await expectTotals(page, { subtotal: '3.00', total: '3.016' })
})

test('estoque abaixo da quantidade bloqueia o total até o ajuste', async ({ page }) => {
  await openApp(page, '/carrinho')
  await seedCart(page, [['emerald-ape-042', 4]])
  await page.reload()
  await expectTotals(page, { subtotal: '4.76', total: '4.776' })

  await mockControl(page, 'updateEdition', { nftId: 'emerald-ape-042', editionId: 'limited-50', available: 3 })

  const row = cartItem(page, 'Emerald Ape #042')
  await expect(row).toContainText('Quantidade indisponível.')
  await expect(row).toContainText('Só é possível levar 3.')
  await expect(page.getByRole('alert').filter({ hasText: 'Ajuste as quantidades destacadas' })).toBeVisible()
  await expect(cartTotals(page)).toBeHidden()
  await expect(announcer(page)).toHaveText('A disponibilidade de Emerald Ape #042 caiu para 3.')

  await row.getByRole('button', { name: 'Ajustar para 3' }).click()
  await expect(row.getByRole('status')).toHaveText('3')
  await expectTotals(page, { subtotal: '3.57', total: '3.586' })
  await expect(row).not.toContainText('Quantidade indisponível.')
})

test('adicionar além do limite é recusado pela API com explicação', async ({ page, isMobile }) => {
  await openApp(page, '/nft/emerald-ape-042')
  await seedCart(page, [['emerald-ape-042', 10]])

  await page
    .getByRole('button', { name: isMobile ? 'Comprar NFT Emerald Ape #042' : 'Comprar Emerald Ape #042' })
    .click()

  await expect(announcer(page)).toContainText('Só é possível levar 10 unidade(s) da edição 1/50 de Emerald Ape #042.')
  await expect(page).toHaveURL(/\/nft\/emerald-ape-042/)
})

test('adicionar sem sair da página: pelo card em telas largas, pelo detalhe no mobile', async ({
  page,
  isMobile,
}) => {
  if (isMobile) {
    await openApp(page, '/nft/sage-nomad-009')
  } else {
    await openApp(page)
    await expect(catalog(page).cards).toHaveCount(9)
  }
  const url = page.url()

  await page.getByRole('button', { name: 'Adicionar Sage Nomad #009 ao carrinho' }).filter({ visible: true }).click()

  await expect(announcer(page)).toHaveText('Sage Nomad #009 adicionado ao carrinho.')
  await expectCartCount(page, 1)
  expect(page.url()).toBe(url)

  await page.getByRole('link', { name: 'Carrinho, 1 item' }).filter({ visible: true }).click()
  await expect(cartItem(page, 'Sage Nomad #009')).toBeVisible()
})

test('edição esgotada não pode ser comprada', async ({ page, isMobile }) => {
  await openApp(page, '/nft/shadow-envoy-039')

  await expect(
    page.getByRole('button', { name: isMobile ? 'Comprar NFT Shadow Envoy #039' : 'Comprar Shadow Envoy #039' }),
  ).toBeDisabled()
})

test('carregamento lento mostra skeletons dos itens e do resumo', async ({ page }) => {
  await openApp(page, '/carrinho')
  await seedCart(page, [['emerald-ape-042', 2]])
  await page.goto('/carrinho?scenario=slow')

  await expect(page.getByTestId('cart-skeleton')).toBeVisible()
  await expect(page.getByTestId('cart-totals-skeleton')).toBeVisible()

  await expectTotals(page, { subtotal: '2.38', total: '2.396' })
  await expect(page.getByTestId('cart-skeleton')).toBeHidden()
  await expect(page.getByTestId('cart-totals-skeleton')).toBeHidden()
})

test('falha ao carregar o carrinho permite tentar de novo', async ({ page }) => {
  await openApp(page, '/carrinho')
  await seedCart(page, [['emerald-ape-042', 2]])
  await page.goto('/carrinho?scenario=server-error')

  const alert = page.getByRole('alert').filter({ hasText: 'Não foi possível carregar o carrinho' })
  await expect(alert).toBeVisible({ timeout: 15_000 })

  await setScenario(page, 'default')
  await alert.getByRole('button', { name: 'Tentar novamente' }).click()
  await expectTotals(page, { subtotal: '2.38', total: '2.396' })
})

test('não há overflow horizontal no carrinho', async ({ page }) => {
  await openApp(page, '/carrinho')
  await seedCart(page, figmaCart)
  await page.reload()
  await expectTotals(page, { subtotal: '26.83', total: '26.846' })

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBe(0)
})
