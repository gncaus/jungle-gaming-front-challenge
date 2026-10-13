import type { Page } from '@playwright/test'

/**
 * Deixa a página estável para uma captura inteira: monta as seções adiadas, força o
 * carregamento das imagens sob demanda, espera todas decodificarem e as fontes carregarem.
 */
export async function settlePage(page: Page): Promise<void> {
  // Seções com `content-visibility: auto` só são montadas perto da área visível; para a
  // captura da página inteira, todas precisam estar montadas.
  await page.addStyleTag({ content: '* { content-visibility: visible !important; }' })
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
