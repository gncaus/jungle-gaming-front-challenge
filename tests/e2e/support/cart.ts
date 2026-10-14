import { expect, type Locator, type Page } from '@playwright/test'
import { api } from './api'

type Seed = readonly [nftId: string, quantity: number, editionId?: string]

/** O carrinho do frame do Figma: subtotal 26.83, taxa 0.016 e total 26.846 ETH. */
export const figmaCart: Seed[] = [
  ['emerald-ape-042', 2],
  ['violet-nomad-314', 6],
  ['ivory-baron-088', 9],
]

/** Identidade de visitante que a aplicação criou neste navegador. */
export async function guestId(page: Page): Promise<string> {
  const handle = await page.waitForFunction(() => localStorage.getItem('kurio.guest.id'))
  return String(await handle.jsonValue())
}

/** Põe itens no carrinho pela API, como visitante (padrão) ou como o dono do token. */
export async function seedCart(page: Page, items: Seed[], token?: string): Promise<void> {
  const identity = token ? { token } : { guestId: await guestId(page) }
  for (const [nftId, quantity, editionId = 'limited-50'] of items) {
    const response = await api(page, 'POST', '/cart/items', { ...identity, body: { nftId, editionId, quantity } })
    expect(response.status).toBe(201)
  }
}

export function cartItem(page: Page, name: string): Locator {
  return page.getByTestId('cart-item').filter({ hasText: name })
}

export const cartTotals = (page: Page): Locator => page.getByTestId('cart-totals')

/** Confere as linhas do resumo, que vêm da cotação da API. */
export async function expectTotals(
  page: Page,
  values: { subtotal: string; discount?: string; total: string },
): Promise<void> {
  const totals = cartTotals(page)
  await expect(totals.getByText(`${values.subtotal} ETH`).first()).toBeVisible()
  if (values.discount) await expect(totals).toContainText(`(-) ${values.discount} ETH`)
  await expect(totals.locator('div', { hasText: 'Total' }).last()).toContainText(`${values.total} ETH`)
}

/** Quantos itens a API diz que há no carrinho de quem está nesta página. */
async function cartItemCount(page: Page): Promise<number> {
  const identity = await page.evaluate(() => ({
    token: localStorage.getItem('kurio.session.token') ?? undefined,
    guestId: localStorage.getItem('kurio.guest.id') ?? undefined,
  }))
  const response = await api<{ itemCount: number }>(page, 'GET', '/cart', identity)
  return response.body.itemCount
}

/**
 * O atalho do carrinho visível (cabeçalho ou navegação inferior) diz quantos itens há.
 * No mobile, detalhe, carrinho e pagamento não têm a navegação inferior, como nos frames;
 * ali a contagem é conferida na API.
 */
export async function expectCartCount(page: Page, count: number): Promise<void> {
  const narrow = (page.viewportSize()?.width ?? 1440) < 768
  const { pathname } = new URL(page.url())
  if (narrow && ['/nft/', '/carrinho', '/pagamento'].some((prefix) => pathname.startsWith(prefix))) {
    await expect.poll(() => cartItemCount(page)).toBe(count)
    return
  }
  const name = count === 0 ? 'Carrinho, vazio' : `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`
  await expect(page.getByRole('link', { name }).filter({ visible: true })).toBeVisible()
}

export const announcer = (page: Page): Locator => page.getByTestId('announcer')
