import { expect, test } from '@playwright/test'

test.describe('base da aplicação', () => {
  test('a home responde pela API simulada', async ({ page }) => {
    const health = page.waitForResponse((response) => response.url().endsWith('/api/health'))
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Seja dono do futuro da arte digital',
    )
    expect((await health).fromServiceWorker()).toBe(true)
    await expect(page.getByRole('status')).toHaveText('API simulada: conectada')
  })

  test('rota inexistente acessada direto mostra 404 e permite voltar', async ({ page }) => {
    await page.goto('/rota/que-nao-existe')

    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()

    await page.getByRole('link', { name: 'Voltar ao início' }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('status')).toHaveText('API simulada: conectada')
  })

  test('não há overflow horizontal', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('status')).toHaveText('API simulada: conectada')

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBe(0)
  })
})
