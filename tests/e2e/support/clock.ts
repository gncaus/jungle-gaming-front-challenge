import type { Page } from '@playwright/test'

const controlled = new WeakSet<Page>()

/**
 * Adianta o relógio da página, que é o relógio que a API simulada lê.
 * Depois do salto o tempo volta a correr normalmente, para a latência dos mocks não travar.
 */
export async function advanceTime(page: Page, ms: number): Promise<void> {
  if (!controlled.has(page)) {
    await page.clock.install()
    controlled.add(page)
  }
  await page.clock.fastForward(ms)
  await page.clock.resume()
}
