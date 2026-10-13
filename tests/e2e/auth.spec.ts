import { expect, test } from '@playwright/test'
import { mockControl, openApp, users } from './support/api'
import {
  authDialog,
  expectSignedIn,
  expectSignedOut,
  openLogin,
  profileLink,
  signIn,
  storedToken,
  submitLogin,
} from './support/session'

test('login recusa senha errada, entra com a certa e a sessão sobrevive a refresh', async ({
  page,
  isMobile,
}) => {
  await openApp(page)
  const dialog = await openLogin(page, isMobile)

  await submitLogin(page, { email: users.ana.email, password: 'senha-errada-1' })
  await expect(dialog.getByRole('alert')).toHaveText('E-mail ou senha incorretos.')
  await expect(dialog).toBeVisible()

  await submitLogin(page, users.ana)
  await expect(dialog).toBeHidden()
  await expectSignedIn(page, isMobile)
  await expect(page).not.toHaveURL(/auth=/)

  await page.reload()
  await expectSignedIn(page, isMobile)
})

test('cadastro valida os campos, trata conflito e cria a conta', async ({ page, isMobile }) => {
  await openApp(page)
  const dialog = await openLogin(page, isMobile)
  await dialog.getByRole('link', { name: isMobile ? 'Crie uma conta' : 'Criar conta' }).click()
  await expect(page).toHaveURL(/auth=criar-conta/)

  const submit = dialog.getByRole('button', { name: 'Criar conta' })
  const username = dialog.getByLabel('Nome de usuário')
  const email = dialog.getByLabel('E-mail')
  const password = dialog.getByLabel('Senha', { exact: true })
  const confirmation = dialog.getByLabel('Confirmar senha', { exact: true })

  // Envio vazio: cada campo é marcado como inválido e aponta para a sua mensagem.
  await submit.click()
  await expect(username).toHaveAttribute('aria-invalid', 'true')
  await expect(username).toHaveAccessibleDescription('Use pelo menos 3 caracteres')
  await expect(email).toHaveAccessibleDescription('Informe um e-mail válido')
  await expect(username).toBeFocused()

  await username.fill('carla.arte')
  await email.fill(users.ana.email)
  await password.fill('Segredo#789')
  await confirmation.fill('Segredo#000')
  await submit.click()
  await expect(confirmation).toHaveAccessibleDescription('As senhas não conferem')

  // E-mail já cadastrado: o erro vem da API e vai para o campo.
  await confirmation.fill('Segredo#789')
  await submit.click()
  await expect(email).toHaveAccessibleDescription('Este e-mail já está cadastrado.')
  await expect(email).toBeFocused()

  await email.fill('carla@kurio.test')
  await submit.click()
  await expect(dialog).toBeHidden()
  await expectSignedIn(page, isMobile)

  await page.goto('/perfil')
  await expect(page.getByText('carla@kurio.test')).toBeVisible()
})

test('rota privada sem sessão leva ao login e volta ao destino depois de entrar', async ({ page }) => {
  await page.goto('/perfil')

  await expect(page).toHaveURL(/auth=entrar/)
  await expect(page).toHaveURL(/redirect=/)
  await expect(authDialog(page)).toBeVisible()

  await submitLogin(page, users.ana)

  await expect(page).toHaveURL('/perfil')
  await expect(page.getByRole('heading', { level: 1, name: 'Perfil do colecionador' })).toBeVisible()
  await expect(page.getByText('ana@kurio.test')).toBeVisible()
})

test('sessão que expira em rota privada reabre o login e retoma a tela', async ({ page, isMobile }) => {
  await openApp(page)
  await signIn(page, isMobile, users.ana)
  await profileLink(page, isMobile).click()
  await expect(page.getByText('ana@kurio.test')).toBeVisible()

  await mockControl(page, 'expireSessions')
  await page.reload()

  await expect(authDialog(page)).toBeVisible()
  await expect(authDialog(page).getByText('Sua sessão expirou. Entre novamente para continuar.')).toBeVisible()
  await expect(page.getByText('ana@kurio.test')).toBeHidden()
  expect(await storedToken(page)).toBeNull()

  await submitLogin(page, users.ana)
  await expect(page).toHaveURL('/perfil')
  await expect(page.getByText('ana@kurio.test')).toBeVisible()
})

test('sessão que expira em página pública pede login sem tirar o usuário do lugar', async ({
  page,
  isMobile,
}) => {
  await openApp(page, '/?tab=trending')
  await signIn(page, isMobile, users.ana)

  await mockControl(page, 'expireSessions')
  await page.reload()

  await expect(authDialog(page).getByText('Sua sessão expirou. Entre novamente para continuar.')).toBeVisible()
  await submitLogin(page, users.ana)

  await expect(authDialog(page)).toBeHidden()
  await expect(page).toHaveURL(/tab=trending/)
  await expectSignedIn(page, isMobile)
})

test('logout e troca de usuário não deixam nada do usuário anterior', async ({ page, isMobile }) => {
  await openApp(page)
  await signIn(page, isMobile, users.ana)
  const anaToken = await storedToken(page)
  const guestBefore = await page.evaluate(() => localStorage.getItem('kurio.guest.id'))

  await profileLink(page, isMobile).click()
  await expect(page.getByText('ana@kurio.test')).toBeVisible()

  await page.getByRole('main').getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL('/')
  await expectSignedOut(page, isMobile)
  expect(await storedToken(page)).toBeNull()
  expect(await page.evaluate(() => localStorage.getItem('kurio.guest.id'))).not.toBe(guestBefore)

  // Voltar no histórico não reabre o perfil de quem saiu.
  await page.goBack()
  await expect(page.getByText('ana@kurio.test')).toBeHidden()
  await expect(authDialog(page)).toBeVisible()

  await submitLogin(page, users.bruno)
  await expect(page).toHaveURL('/perfil')
  await expect(page.getByText('bruno@kurio.test')).toBeVisible()
  await expect(page.getByText('Ana Ribeiro')).toHaveCount(0)
  await expect(page.getByText('ana@kurio.test')).toHaveCount(0)
  expect(await storedToken(page)).not.toBe(anaToken)
})

test('link de login com sessão ativa segue direto para o destino', async ({ page, isMobile }) => {
  await openApp(page)
  await signIn(page, isMobile, users.ana)

  await page.goto('/?auth=entrar&redirect=%2Fperfil')

  await expect(page).toHaveURL('/perfil')
  await expect(authDialog(page)).toBeHidden()
})

test('destino externo no parâmetro de retorno é ignorado', async ({ page }) => {
  await page.goto('/?auth=entrar&redirect=https%3A%2F%2Fexemplo.com')
  await submitLogin(page, users.ana)

  await expect(authDialog(page)).toBeHidden()
  await expect(page).toHaveURL('/')
})

test('diálogo de login prende o foco, fecha com Esc e devolve o foco', async ({ page, isMobile }) => {
  await openApp(page)
  const dialog = await openLogin(page, isMobile)

  // O foco entra no diálogo e o Tab não sai dele.
  await expect(dialog.locator(':focus')).toHaveCount(1)
  for (let step = 0; step < 12; step += 1) {
    await page.keyboard.press('Tab')
    await expect(dialog.locator(':focus')).toHaveCount(1)
  }

  // Enter no campo envia o formulário.
  await dialog.getByLabel('E-mail').focus()
  await page.keyboard.press('Enter')
  await expect(dialog.getByLabel('E-mail')).toHaveAttribute('aria-invalid', 'true')

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page).not.toHaveURL(/auth=/)
  // O foco volta para o link que abriu o diálogo.
  await expect(page.getByRole('link', { name: 'Entrar' }).filter({ visible: true })).toBeFocused()
})

test('ações de login fora do escopo avisam que não estão disponíveis', async ({ page, isMobile }) => {
  await openApp(page)
  const dialog = await openLogin(page, isMobile)

  await dialog.getByRole('button', { name: 'Continuar com Google' }).click()
  await expect(dialog.getByText('Entrar com o Google não está disponível nesta demonstração.')).toBeVisible()

  await dialog.getByRole('button', { name: 'Esqueceu a senha?' }).click()
  await expect(dialog.getByText('A recuperação de senha não está disponível nesta demonstração.')).toBeVisible()

  expect(await storedToken(page)).toBeNull()
})

test('mostrar senha alterna a visibilidade do campo', async ({ page, isMobile }) => {
  await openApp(page)
  const dialog = await openLogin(page, isMobile)
  const password = dialog.getByLabel('Senha', { exact: true })

  await password.fill('Kurio@123')
  await expect(password).toHaveAttribute('type', 'password')

  await dialog.getByRole('button', { name: 'Mostrar senha' }).click()
  await expect(password).toHaveAttribute('type', 'text')
})
