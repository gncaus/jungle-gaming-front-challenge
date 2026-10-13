import { expect, type Locator, type Page } from '@playwright/test'

/** A grade do catálogo e os cards visíveis nela. */
export function catalog(page: Page) {
  const section = page.locator('#catalogo')
  return {
    section,
    cards: section.getByRole('article'),
    cardNames: section.getByRole('article').getByRole('heading'),
  }
}

export async function expectResults(page: Page, total: number): Promise<void> {
  const text = total === 1 ? '1 NFT encontrado' : `${total} NFTs encontrados`
  await expect(catalog(page).section.getByText(text)).toBeVisible()
}

/**
 * Onde ficam os filtros: na lateral em telas largas e em um painel no mobile.
 * No mobile, abre o painel e devolve o diálogo.
 */
export async function openFilters(page: Page, isMobile: boolean): Promise<Locator> {
  if (!isMobile) {
    return page.locator('#catalogo')
  }
  await page.getByRole('button', { name: 'Abrir filtros' }).click()
  const dialog = page.getByRole('dialog', { name: 'Filtros' })
  await expect(dialog).toBeVisible()
  return dialog
}

export async function closeFilters(page: Page, isMobile: boolean): Promise<void> {
  if (!isMobile) return
  await page.getByRole('button', { name: 'Ver resultados' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
}

/** Busca pelo campo do cabeçalho (telas largas) ou pela barra do topo (mobile). */
export async function searchFor(page: Page, isMobile: boolean, term: string): Promise<void> {
  if (!isMobile && !(await page.getByRole('searchbox').isVisible())) {
    await page.getByRole('button', { name: 'Abrir busca' }).click()
  }
  const field = page.getByRole('searchbox')
  await field.fill(term)
  await field.press('Enter')
}
