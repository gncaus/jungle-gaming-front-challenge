import { expect, test, type Locator, type Page } from '@playwright/test'
import { openApp, users } from './support/api'
import { announcer } from './support/cart'
import { authDialog, expectSignedIn, openLogin, submitLogin } from './support/session'

type User = (typeof users)[keyof typeof users]

/** PNG de 1 × 1 px. */
const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

/** Abre uma tela privada direto pelo endereço: o login aparece e devolve o usuário a ela. */
async function enter(page: Page, path: string, user: User = users.ana): Promise<Locator> {
  await openApp(page, path)
  await submitLogin(page, user)
  await expect(authDialog(page)).toBeHidden()
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  return page.getByRole('main')
}

test('perfil: valida os campos, trata conflito da API e a edição persiste após refresh', async ({
  page,
  isMobile,
}) => {
  const main = await enter(page, '/perfil')
  const form = main.getByRole('form', { name: 'Perfil do colecionador' })
  const displayName = form.getByLabel('Nome de exibição')
  const email = form.getByLabel('E-mail')
  const save = form.getByRole('button', { name: 'Salvar', exact: true })

  await expect(displayName).toHaveValue('Ana Ribeiro')
  await expect(form.getByLabel('Nome ENS')).toHaveValue('anaribeiro')

  await displayName.fill('A')
  await email.fill('invalido')
  await save.click()
  await expect(displayName).toHaveAttribute('aria-invalid', 'true')
  await expect(displayName).toHaveAccessibleDescription('Use pelo menos 2 caracteres')
  await expect(email).toHaveAccessibleDescription('Informe um e-mail válido')
  await expect(displayName).toBeFocused()

  // E-mail de outra conta: o erro vem da API e vai para o campo.
  await displayName.fill('Ana R. Lima')
  await email.fill(users.bruno.email)
  await save.click()
  await expect(email).toHaveAccessibleDescription('Este e-mail já está cadastrado.')
  await expect(email).toBeFocused()

  await email.fill('ana.lima@kurio.test')
  await form.getByLabel('Apelido da carteira').fill('Cofre novo')
  await save.click()
  await expect(announcer(page)).toHaveText('Perfil salvo.')
  if (!isMobile) {
    await expect(page.getByRole('banner').getByRole('link', { name: 'Perfil de Ana R. Lima' })).toBeVisible()
  }

  await page.reload()
  await expect(displayName).toHaveValue('Ana R. Lima')
  await expect(email).toHaveValue('ana.lima@kurio.test')
  await expect(form.getByLabel('Apelido da carteira')).toHaveValue('Cofre novo')
})

test('avatar: envio e remoção persistem, e arquivo que não é imagem é recusado', async ({ page }) => {
  const main = await enter(page, '/perfil')
  const avatar = main.getByRole('group', { name: 'Avatar' })
  const file = avatar.getByLabel('Arquivo do avatar')
  const picture = avatar.getByRole('img', { name: 'Avatar atual' })
  const remove = avatar.getByRole('button', { name: 'Remover' })

  await expect(remove).toBeDisabled()

  await file.setInputFiles({ name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('não é imagem') })
  await expect(avatar.getByRole('alert')).toHaveText('Envie uma imagem PNG, JPEG ou WebP.')
  await expect(picture).toBeHidden()

  await file.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: tinyPng })
  await expect(picture).toBeVisible()
  await expect(announcer(page)).toHaveText('Avatar atualizado.')
  await expect(avatar.getByRole('alert')).toBeHidden()

  await page.reload()
  await expect(picture).toBeVisible()

  await remove.click()
  await expect(picture).toBeHidden()
  await expect(announcer(page)).toHaveText('Avatar removido.')

  await page.reload()
  await expect(main.getByRole('form', { name: 'Perfil do colecionador' })).toBeVisible()
  await expect(picture).toBeHidden()
})

test('senha: recusa a atual errada, troca e a nova passa a valer no login', async ({ page, isMobile }) => {
  const newPassword = 'Segredo#789'
  const main = await enter(page, '/perfil')
  const form = main.getByRole('form', { name: 'Alterar senha' })
  const current = form.getByLabel('Senha atual', { exact: true })
  const next = form.getByLabel('Nova senha', { exact: true })
  const confirmation = form.getByLabel('Confirmar nova senha', { exact: true })
  const submit = form.getByRole('button', { name: 'Alterar senha' })

  await current.fill(users.ana.password)
  await next.fill('curta1')
  await confirmation.fill('outra')
  await submit.click()
  await expect(next).toHaveAccessibleDescription('Use pelo menos 8 caracteres')
  await expect(confirmation).toHaveAccessibleDescription('As senhas não conferem')

  // Senha atual errada: quem recusa é a API.
  await current.fill('Errada@000')
  await next.fill(newPassword)
  await confirmation.fill(newPassword)
  await submit.click()
  await expect(current).toHaveAccessibleDescription('Senha atual incorreta.')
  await expect(current).toBeFocused()

  await current.fill(users.ana.password)
  await submit.click()
  await expect(announcer(page)).toHaveText('Senha alterada.')
  await expect(current).toHaveValue('')

  await main.getByRole('button', { name: 'Sair' }).click()
  const dialog = await openLogin(page, isMobile)
  await submitLogin(page, users.ana)
  await expect(dialog.getByRole('alert')).toHaveText('E-mail ou senha incorretos.')

  await submitLogin(page, { email: users.ana.email, password: newPassword })
  await expect(dialog).toBeHidden()
  await expectSignedIn(page, isMobile)
})

test('carteiras: cadastro com validação, secundária igual à principal e edição persistem', async ({ page }) => {
  // Bruno começa sem nenhuma carteira.
  const main = await enter(page, '/perfil/carteiras', users.bruno)
  const primary = main.getByRole('region', { name: 'Carteira principal' })
  const secondary = main.getByRole('region', { name: 'Carteira secundária' })
  const address = '0x52Bc44d5378309EE2abF1539BF71dE1b7d7bE3b5'

  // Sem principal, o formulário já vem aberto, com as sugestões do perfil.
  await expect(primary.getByLabel('Nome de exibição')).toHaveValue('Bruno Tavares')
  await expect(primary.getByLabel('E-mail')).toHaveValue(users.bruno.email)
  await expect(secondary.getByText('Você ainda não adicionou uma carteira secundária.')).toBeVisible()
  await expect(secondary.getByLabel('Igual à carteira principal')).toBeHidden()

  await primary.getByLabel('Endereço da carteira').fill('0x123')
  await primary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(primary.getByLabel('Endereço da carteira')).toHaveAccessibleDescription(
    'Informe um endereço 0x com 40 caracteres hexadecimais',
  )
  await expect(primary.getByLabel('Rede')).toHaveAccessibleDescription('Selecione uma rede')

  await primary.getByLabel('Apelido da carteira').fill('Cofre do Bruno')
  await primary.getByLabel('Rede').selectOption('polygon')
  await primary.getByLabel('Nome do perfil').fill('Bruno Colecionador')
  await primary.getByLabel('Endereço da carteira').fill(address)
  await primary.getByLabel('Tipo de carteira').selectOption('walletconnect')
  await primary.getByLabel('Código de indicação').fill('BRUNO-01')
  await primary.getByLabel('Nome ENS').fill('brunotavares')
  await primary.getByRole('button', { name: 'Salvar carteira' }).click()

  await expect(announcer(page)).toHaveText('Carteira salva.')
  await expect(primary.getByText('Cofre do Bruno')).toBeVisible()
  await expect(primary.getByText('Polygon')).toBeVisible()
  await expect(primary.getByText('Desconectada')).toBeVisible()
  await expect(primary.getByRole('button', { name: 'Editar carteira principal' })).toBeFocused()

  // A secundária parte dos dados da principal.
  await secondary.getByLabel('Igual à carteira principal').check()
  await secondary.getByRole('button', { name: 'Adicionar carteira secundária' }).click()
  await expect(secondary.getByLabel('Endereço da carteira')).toHaveValue(address)
  await expect(secondary.getByLabel('Rede')).toHaveValue('polygon')
  await secondary.getByLabel('Apelido da carteira').fill('Reserva')
  await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(secondary.getByText('Reserva')).toBeVisible()

  // Edição da principal.
  await primary.getByRole('button', { name: 'Editar carteira principal' }).click()
  await primary.getByLabel('Rede').selectOption('ethereum')
  await primary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(primary.getByText('Ethereum')).toBeVisible()

  await page.reload()
  await expect(primary.getByText('Cofre do Bruno')).toBeVisible()
  await expect(primary.getByText('Ethereum')).toBeVisible()
  await expect(secondary.getByText('Reserva')).toBeVisible()
  await expect(secondary.getByText('Polygon')).toBeVisible()
})

test('área do colecionador: navegação entre seções, sem rolagem horizontal', async ({ page }) => {
  const main = await enter(page, '/perfil')
  const nav = main.getByRole('navigation', { name: 'Meu perfil' })
  const overflow = () =>
    page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

  await expect(nav.getByRole('link', { name: 'Dados do perfil' })).toHaveAttribute('aria-current', 'page')
  await expect(main.getByRole('form', { name: 'Perfil do colecionador' })).toBeVisible()
  expect(await overflow()).toBe(0)

  await nav.getByRole('link', { name: 'Carteiras' }).click()
  await expect(page).toHaveURL(/\/perfil\/carteiras$/)
  await expect(nav.getByRole('link', { name: 'Carteiras' })).toHaveAttribute('aria-current', 'page')
  // Ana já tem a principal cadastrada: aparece o resumo, não o formulário.
  await expect(main.getByRole('region', { name: 'Carteira principal' }).getByText('Cofre principal')).toBeVisible()
  expect(await overflow()).toBe(0)
})
