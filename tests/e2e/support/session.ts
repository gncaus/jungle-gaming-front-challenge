import { expect, type Locator, type Page } from '@playwright/test'

interface Credentials {
  email: string
  password: string
}

export function authDialog(page: Page): Locator {
  return page.getByRole('dialog')
}

/** Abre o login pelo cabeçalho (telas largas) ou pela navegação inferior (mobile). */
export async function openLogin(page: Page, isMobile: boolean): Promise<Locator> {
  const entry = isMobile
    ? page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Entrar' })
    : page.getByRole('banner').getByRole('link', { name: 'Entrar' })
  await entry.click()
  await expect(authDialog(page)).toBeVisible()
  return authDialog(page)
}

/** Preenche e envia o formulário de login já aberto. */
export async function submitLogin(page: Page, credentials: Credentials): Promise<void> {
  const dialog = authDialog(page)
  await dialog.getByLabel('E-mail').fill(credentials.email)
  await dialog.getByLabel('Senha', { exact: true }).fill(credentials.password)
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
}

export async function signIn(page: Page, isMobile: boolean, credentials: Credentials): Promise<void> {
  await openLogin(page, isMobile)
  await submitLogin(page, credentials)
  await expect(authDialog(page)).toBeHidden()
  await expectSignedIn(page, isMobile)
}

/** O link de perfil só existe para quem tem sessão. */
export function profileLink(page: Page, isMobile: boolean): Locator {
  return isMobile
    ? page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Perfil' })
    : page.getByRole('banner').getByRole('link', { name: /^Perfil de / })
}

export async function expectSignedIn(page: Page, isMobile: boolean): Promise<void> {
  await expect(profileLink(page, isMobile)).toBeVisible()
}

export async function expectSignedOut(page: Page, isMobile: boolean): Promise<void> {
  const entry = isMobile
    ? page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Entrar' })
    : page.getByRole('banner').getByRole('link', { name: 'Entrar' })
  await expect(entry).toBeVisible()
}

export async function storedToken(page: Page): Promise<string | null> {
  return page.evaluate(() => localStorage.getItem('kurio.session.token'))
}
