import type { Page } from '@playwright/test'

/**
 * Deixa a página estável para uma captura inteira: força o carregamento das imagens
 * marcadas como sob demanda, espera todas decodificarem e as fontes carregarem.
 */
export async function settlePage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(
      Array.from(document.images, async (image) => {
        image.loading = 'eager'
        if (!image.complete) {
          await new Promise((resolve) => {
            image.onload = resolve
            image.onerror = resolve
          })
        }
        await image.decode().catch(() => undefined)
      }),
    )
  })
}
