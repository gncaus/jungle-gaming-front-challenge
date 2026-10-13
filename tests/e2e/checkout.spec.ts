import { expect, test } from '@playwright/test'
import { mockControl, openApp, setScenario, users } from './support/api'
import { announcer, cartItem, cartTotals, expectCartCount, expectTotals, seedCart } from './support/cart'
import { catalog } from './support/catalog'
import {
  confirmButton,
  connectionState,
  goToCheckout,
  orderCount,
  receiptTitle,
  settled,
} from './support/checkout'
import { authDialog, signIn, submitLogin } from './support/session'

test('compra completa, do catálogo ao recibo confirmado', async ({ page, isMobile }) => {
  await openApp(page)
  await catalog(page).cards.filter({ hasText: 'Emerald Ape #042' }).getByRole('link').click()
  await page.getByRole('group', { name: /^Quantidade de / }).getByRole('button', { name: 'Aumentar quantidade' }).click()
  await page
    .getByRole('button', { name: isMobile ? 'Comprar NFT Emerald Ape #042' : 'Comprar Emerald Ape #042' })
    .click()
  await expect(cartItem(page, 'Emerald Ape #042')).toBeVisible()

  // Pagamento exige sessão: o visitante entra e volta para onde ia.
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(authDialog(page)).toBeVisible()
  await submitLogin(page, users.ana)
  await expect(page).toHaveURL('/pagamento')
  await expectTotals(page, { subtotal: '2.38', total: '2.396' })

  // Sem a carteira conectada, a compra não pode ser confirmada, e a tela diz por quê.
  await expect(confirmButton(page)).toBeDisabled()
  await expect(page.getByText('Conecte a carteira.')).toBeVisible()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(connectionState(page)).toHaveText('Carteira conectada')

  await confirmButton(page).click()
  await expect(page).toHaveURL(/\/pedido\/ord_\d+$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Processando seu pagamento' })).toBeVisible()
  // Enquanto o pedido está pendente, o recibo não existe.
  await expect(page.getByText(receiptTitle)).toHaveCount(0)

  await expect(page.getByRole('heading', { level: 1, name: receiptTitle })).toBeVisible(settled)
  await expect(page.getByText(/^0x[0-9a-f]{4}…[0-9a-f]{4}$/)).toBeVisible()
  const receipt = page.getByRole('region', { name: receiptTitle })
  await expect(receipt.getByText('MetaMask')).toBeVisible()
  const item = page.getByTestId('order-item')
  await expect(item).toContainText('Emerald Ape #042')
  await expect(item).toContainText('(x 2)')
  await expect(page.getByTestId('receipt-totals')).toContainText('2.396 ETH')
  await expect(page.getByRole('link', { name: /Ver no Etherscan/ })).toHaveAttribute(
    'href',
    /^https:\/\/etherscan\.io\/tx\/0x[0-9a-f]{64}$/,
  )
  expect(await orderCount(page)).toBe(1)
  await expectCartCount(page, 0)

  // O recibo é o snapshot da compra: mudar o catálogo depois não o altera.
  await mockControl(page, 'updateEdition', { nftId: 'emerald-ape-042', editionId: 'limited-50', price: '9.99' })
  await page.reload()
  await expect(page.getByTestId('receipt-totals')).toContainText('2.396 ETH')
  await expect(page.getByTestId('order-item')).toContainText('2.38 ETH')
})

test('pagamento recusado mantém o carrinho e permite tentar de novo', async ({ page, isMobile }) => {
  await goToCheckout(page, isMobile)
  await setScenario(page, 'payment-declined')

  await confirmButton(page).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pagamento recusado' })).toBeVisible(settled)
  await expect(page.getByRole('alert')).toContainText('Pagamento recusado pela carteira.')
  await expect(page.getByText(receiptTitle)).toHaveCount(0)
  await expectCartCount(page, 2)

  await setScenario(page, 'default')
  await page.getByRole('link', { name: 'Tentar novamente' }).click()
  await expect(page).toHaveURL('/pagamento')
  await confirmButton(page).click()
  await expect(page.getByRole('heading', { level: 1, name: receiptTitle })).toBeVisible(settled)
  // A nova tentativa é outro pedido; o recusado continua recusado.
  expect(await orderCount(page)).toBe(2)
})

test('clique repetido em confirmar cria um único pedido', async ({ page, isMobile }) => {
  await goToCheckout(page, isMobile)

  await confirmButton(page).dblclick()
  await expect(page).toHaveURL(/\/pedido\/ord_\d+$/)

  expect(await orderCount(page)).toBe(1)
})

test('timeout depois de criar o pedido: tentar de novo recupera o mesmo pedido', async ({ page, isMobile }) => {
  await goToCheckout(page, isMobile)
  await setScenario(page, 'order-timeout')

  await confirmButton(page).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível confirmar se o pedido foi criado' })).toBeVisible()
  await expect(page).toHaveURL('/pagamento')
  // O pedido existe no servidor, mas o cliente não recebeu a resposta.
  expect(await orderCount(page)).toBe(1)

  await confirmButton(page).click()
  await expect(page).toHaveURL(/\/pedido\/ord_\d+$/)
  await expect(page.getByRole('heading', { level: 1, name: receiptTitle })).toBeVisible(settled)
  expect(await orderCount(page)).toBe(1)
})

test('preço muda pelo socket durante o checkout e exige nova confirmação', async ({ page, isMobile }) => {
  await goToCheckout(page, isMobile)

  await mockControl(page, 'updateEdition', { nftId: 'emerald-ape-042', editionId: 'limited-50', price: '1.5' })

  const notice = page.getByRole('alert').filter({ hasText: 'O total era' })
  await expect(notice).toContainText('O total era 2.396 ETH e agora é 3.016 ETH.')
  await expectTotals(page, { subtotal: '3.00', total: '3.016' })
  await expect(confirmButton(page)).toBeDisabled()
  await expect(page.getByText('Revise os novos valores do pedido.')).toBeVisible()

  await notice.getByRole('button', { name: 'Revisei os novos valores' }).click()
  await expect(notice).toBeHidden()
  await confirmButton(page).click()

  await expect(page.getByRole('heading', { level: 1, name: receiptTitle })).toBeVisible(settled)
  await expect(page.getByTestId('receipt-totals')).toContainText('3.016 ETH')
})

test('preço muda no instante do envio: o servidor recusa e a tela pede nova confirmação', async ({
  page,
  isMobile,
}) => {
  await goToCheckout(page, isMobile)
  await setScenario(page, 'price-changed')

  await confirmButton(page).click()

  const notice = page.getByRole('alert').filter({ hasText: 'O total era' })
  await expect(notice).toContainText('O total era 2.396 ETH e agora é 2.634 ETH.')
  await expect(page).toHaveURL('/pagamento')
  expect(await orderCount(page)).toBe(0)

  await notice.getByRole('button', { name: 'Revisei os novos valores' }).click()
  await confirmButton(page).click()
  await expect(page.getByRole('heading', { level: 1, name: receiptTitle })).toBeVisible(settled)
  await expect(page.getByTestId('receipt-totals')).toContainText('2.634 ETH')
  expect(await orderCount(page)).toBe(1)
})

test('edição esgota durante a compra e o pedido não é criado', async ({ page, isMobile }) => {
  await goToCheckout(page, isMobile)
  await setScenario(page, 'sold-out')

  await confirmButton(page).click()

  await expect(page.getByText('Ajuste as quantidades no carrinho.')).toBeVisible()
  await expect(confirmButton(page)).toBeDisabled()
  await expect(cartTotals(page)).toBeHidden()
  expect(await orderCount(page)).toBe(0)

  await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
  await expect(cartItem(page, 'Emerald Ape #042')).toContainText('Esta edição esgotou')
})

test('carteira: recusa, conexão e desconexão', async ({ page, isMobile }) => {
  await goToCheckout(page, isMobile, { connect: false })
  await expect(connectionState(page)).toHaveText('Carteira desconectada')

  await setScenario(page, 'wallet-rejected')
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'A conexão foi recusada na carteira.' })).toBeVisible()
  await expect(connectionState(page)).toHaveText('Carteira desconectada')
  await expect(confirmButton(page)).toBeDisabled()

  await setScenario(page, 'default')
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(connectionState(page)).toHaveText('Carteira conectada')
  await expect(announcer(page)).toHaveText('Carteira conectada.')
  await expect(confirmButton(page)).toBeEnabled()

  await page.getByRole('button', { name: 'Desconectar' }).click()
  await expect(connectionState(page)).toHaveText('Carteira desconectada')
  await expect(confirmButton(page)).toBeDisabled()
})

test('quem não tem carteira cadastra pelo pagamento, com validação dos campos', async ({ page, isMobile }) => {
  await openApp(page, '/carrinho')
  await seedCart(page, [['golden-beat-207', 1]])
  await page.reload()
  await signIn(page, isMobile, users.bruno)
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()

  await expect(page.getByText('Cadastre a carteira principal.')).toBeVisible()
  const save = page.getByRole('button', { name: 'Salvar carteira' })
  const address = page.getByLabel('Endereço da carteira')

  await address.fill('0x123')
  await save.click()
  await expect(address).toHaveAccessibleDescription('Informe um endereço 0x com 40 caracteres hexadecimais')
  await expect(page.getByLabel('Rede')).toHaveAccessibleDescription('Selecione uma rede')
  await expect(page.getByLabel('Tipo de carteira')).toHaveAccessibleDescription('Selecione uma carteira')

  await page.getByLabel('Apelido da carteira').fill('Carteira do dia a dia')
  await page.getByLabel('Rede').selectOption({ label: 'Polygon' })
  await page.getByLabel('Nome do perfil').fill('Bruno NFT')
  await address.fill('0x1234567890abcdef1234567890ABCDEF12345678')
  await page.getByLabel('Tipo de carteira').selectOption({ label: 'Coinbase Wallet' })
  await page.getByLabel('Código de indicação').fill('AMIGO-01')
  await page.getByLabel('Nome ENS (sem o .eth)').fill('brunonft')
  await save.click()
  await expect(announcer(page)).toHaveText('Carteira salva.')

  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(connectionState(page)).toHaveText('Carteira conectada')
  await confirmButton(page).click()

  await expect(page.getByRole('heading', { level: 1, name: receiptTitle })).toBeVisible(settled)
  await expect(page.getByRole('region', { name: receiptTitle }).getByText('Coinbase Wallet')).toBeVisible()
  await expect(page.getByRole('link', { name: /Ver no Polygonscan/ })).toBeVisible()
})

test('refresh com o pedido pendente retoma o mesmo pedido', async ({ page, isMobile }) => {
  await goToCheckout(page, isMobile)
  await confirmButton(page).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Processando seu pagamento' })).toBeVisible()
  const url = page.url()

  await page.reload()
  expect(page.url()).toBe(url)

  await expect(page.getByRole('heading', { level: 1, name: receiptTitle })).toBeVisible(settled)
  expect(await orderCount(page)).toBe(1)
})

test('sessão que expira no pagamento volta para a mesma tela, com carrinho e cupom', async ({
  page,
  isMobile,
}) => {
  await goToCheckout(page, isMobile, { connect: false })
  await page.goto('/pagamento?cupom=KURIO10')
  await expectTotals(page, { subtotal: '2.38', discount: '0.238', total: '2.158' })

  await mockControl(page, 'expireSessions')
  await page.getByRole('button', { name: 'Conectar carteira' }).click()

  await expect(authDialog(page).getByText('Sua sessão expirou. Entre novamente para continuar.')).toBeVisible()
  await submitLogin(page, users.ana)

  await expect(page).toHaveURL(/\/pagamento\?cupom=KURIO10$/)
  await expectTotals(page, { subtotal: '2.38', discount: '0.238', total: '2.158' })
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(connectionState(page)).toHaveText('Carteira conectada')
})

test('pedido de outro usuário não é exibido', async ({ page, isMobile }) => {
  await goToCheckout(page, isMobile)
  await confirmButton(page).click()
  await expect(page).toHaveURL(/\/pedido\/ord_\d+$/)
  const orderUrl = new URL(page.url()).pathname

  await page.goto('/perfil')
  await page.getByRole('main').getByRole('button', { name: 'Sair' }).click()
  await signIn(page, isMobile, users.bruno)
  await page.goto(orderUrl)

  await expect(page.getByRole('heading', { level: 1, name: 'Este pedido pertence a outra conta' })).toBeVisible()
  await expect(page.getByText('Emerald Ape #042')).toHaveCount(0)
})

test('não há overflow horizontal no pagamento', async ({ page, isMobile }) => {
  await goToCheckout(page, isMobile)

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBe(0)
})
