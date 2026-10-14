import { expect, type Locator, type Page } from '@playwright/test'

interface Credentials {
  email: string
  password: string
}

export function authDialog(page: Page): Locator {
  return page.getByRole('dialog')
}

/**
 * Abre o login pelo cabeçalho (telas largas) ou pela navegação inferior (mobile). Detalhe,
 * carrinho e pagamento não têm a navegação inferior no mobile, como nos frames; ali o login
 * é aberto pelo endereço, que é o mesmo `?auth=entrar` que o link usaria.
 */
export async function openLogin(page: Page, isMobile: boolean): Promise<Locator> {
  const entry = isMobile
    ? page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Entrar' })
    : page.getByRole('banner').getByRole('link', { name: 'Entrar' })
  if (isMobile && !onPageWithMobileNav(page)) {
    const url = new URL(page.url())
    url.searchParams.set('auth', 'entrar')
    await page.goto(url.pathname + url.search)
  } else {
    await entry.click()
  }
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

/** Mesma regra de `src/app/layout/mobile-nav-visibility.ts`. */
function onPageWithMobileNav(page: Page): boolean {
  const { pathname } = new URL(page.url())
  return !['/nft/', '/carrinho', '/pagamento'].some((prefix) => pathname.startsWith(prefix))
}

export async function expectSignedIn(page: Page, isMobile: boolean): Promise<void> {
  // Sem a navegação inferior não há link de perfil no mobile: vale o token guardado.
  if (isMobile && !onPageWithMobileNav(page)) {
    await expect.poll(() => storedToken(page)).not.toBeNull()
    return
  }
  await expect(profileLink(page, isMobile)).toBeVisible()
}

export async function expectSignedOut(page: Page, isMobile: boolean): Promise<void> {
  if (isMobile && !onPageWithMobileNav(page)) {
    await expect.poll(() => storedToken(page)).toBeNull()
    return
  }
  const entry = isMobile
    ? page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Entrar' })
    : page.getByRole('banner').getByRole('link', { name: 'Entrar' })
  await expect(entry).toBeVisible()
}

export async function storedToken(page: Page): Promise<string | null> {
  return page.evaluate(() => localStorage.getItem('kurio.session.token'))
}
