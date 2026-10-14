import { expect, test } from '@playwright/test'
import { mockControl, openApp, setScenario } from './support/api'
import { catalog, closeFilters, expectResults, openFilters, searchFor } from './support/catalog'

test('catálogo carrega a primeira página com 9 de 36 NFTs', async ({ page }) => {
  await openApp(page)

  await expectResults(page, 36)
  await expect(catalog(page).cards).toHaveCount(9)
  await expect(catalog(page).cardNames.first()).toHaveText('Emerald Ape #042')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('busca, filtros combinados e ordenação vão para a URL e sobrevivem a refresh', async ({
  page,
  isMobile,
}) => {
  await openApp(page)

  let filters = await openFilters(page, isMobile)
  await filters.getByRole('checkbox', { name: /Música/ }).check()
  await closeFilters(page, isMobile)
  await expectResults(page, 4)

  filters = await openFilters(page, isMobile)
  await filters.getByRole('checkbox', { name: /Solana/ }).check()
  await closeFilters(page, isMobile)
  await expectResults(page, 2)

  // No mobile a ordenação fica no painel de filtros.
  filters = await openFilters(page, isMobile)
  await filters.getByLabel('Ordenar por:').selectOption({ label: 'Menor preço' })
  await closeFilters(page, isMobile)
  await expect(catalog(page).cardNames).toHaveText(['Golden Frequency #071', 'Golden Beat #207'])

  await searchFor(page, isMobile, 'beat')
  await expectResults(page, 1)
  await expect(catalog(page).cardNames).toHaveText(['Golden Beat #207'])

  const url = new URL(page.url())
  expect(url.searchParams.get('q')).toBe('beat')
  expect(url.searchParams.get('sort')).toBe('price-asc')
  expect(url.search).toContain('musica')
  expect(url.search).toContain('solana')

  await page.reload()
  await expectResults(page, 1)
  await expect(catalog(page).cardNames).toHaveText(['Golden Beat #207'])
  filters = await openFilters(page, isMobile)
  await expect(filters.getByLabel('Ordenar por:')).toHaveValue('price-asc')
  await expect(filters.getByRole('checkbox', { name: /Música/ })).toBeChecked()
  await expect(filters.getByRole('checkbox', { name: /Solana/ })).toBeChecked()
})

test('voltar e avançar no histórico restauram cada estado do catálogo', async ({ page, isMobile }) => {
  await openApp(page)

  const filters = await openFilters(page, isMobile)
  await filters.getByRole('checkbox', { name: /Jogos/ }).check()
  await closeFilters(page, isMobile)
  await expectResults(page, 4)

  await page.getByRole('link', { name: 'Em alta', exact: true }).click()
  await expect(catalog(page).section.getByText('Nenhum NFT encontrado')).toBeVisible()

  await page.goBack()
  await expectResults(page, 4)

  await page.goBack()
  await expectResults(page, 36)

  await page.goForward()
  await expectResults(page, 4)
  await expect(page).toHaveURL(/jogos/)
})

test('paginação navega pelas páginas e mudar um filtro volta para a primeira', async ({
  page,
  isMobile,
}) => {
  await openApp(page)
  const pagination = page.getByRole('navigation', { name: 'Paginação do catálogo' })

  await pagination.getByRole('link', { name: 'Página 2' }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(catalog(page).cardNames.first()).toHaveText('Jade Regent #301')
  await expect(pagination.getByRole('link', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')

  await pagination.getByRole('link', { name: 'Próxima página' }).click()
  await expect(page).toHaveURL(/page=3/)

  await page.goBack()
  await expect(page).toHaveURL(/page=2/)
  await expect(catalog(page).cardNames.first()).toHaveText('Jade Regent #301')

  const filters = await openFilters(page, isMobile)
  await filters.getByRole('checkbox', { name: /Ethereum/ }).check()
  await closeFilters(page, isMobile)
  await expectResults(page, 17)
  await expect(page).not.toHaveURL(/page=/)
  await expect(pagination.getByRole('link', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
})

test('abas filtram novos lançamentos e NFTs em alta', async ({ page }) => {
  await openApp(page)

  await page.getByRole('link', { name: 'Novos lançamentos', exact: true }).click()
  await expectResults(page, 6)
  await expect(page).toHaveURL(/tab=new/)

  await page.getByRole('link', { name: 'Em alta', exact: true }).click()
  await expectResults(page, 6)
  await expect(catalog(page).cardNames.first()).toHaveText('Emerald Ape #042')
})

test('faixa de preço é aplicada pelo teclado', async ({ page, isMobile }) => {
  await openApp(page)

  const filters = await openFilters(page, isMobile)
  const minimum = filters.getByRole('slider', { name: 'Preço mínimo' })
  await minimum.focus()
  // Cada PageUp sobe 10 centésimos de ETH: 60 vezes levam o mínimo de 0,02 para 6,02.
  for (let press = 0; press < 60; press += 1) {
    await minimum.press('PageUp')
  }
  await expect(filters.getByText('Preço: 6,02 – 12,30 ETH')).toBeVisible()
  await filters.getByRole('button', { name: 'Aplicar' }).click()
  await closeFilters(page, isMobile)

  await expectResults(page, 2)
  await expect(catalog(page).cardNames).toHaveText(['Royal Emerald #003', 'Ivy Champion #020'])
  await expect(page).toHaveURL(/minPrice/)
})

test('resultado vazio oferece limpar a busca', async ({ page }) => {
  await openApp(page, '/?q=inexistente')

  await expect(catalog(page).section.getByText('Nenhum NFT encontrado')).toBeVisible()
  await expect(catalog(page).cards).toHaveCount(0)

  await page.getByRole('button', { name: 'Limpar busca e filtros' }).click()
  await expectResults(page, 36)
  await expect(page).not.toHaveURL(/q=/)
})

test('parâmetro inválido na URL cai no padrão em vez de quebrar a página', async ({ page }) => {
  await openApp(page, '/?page=abc&sort=aleatorio&tab=nada')

  await expectResults(page, 36)
  await expect(catalog(page).cardNames.first()).toHaveText('Emerald Ape #042')
  await expect(page.getByLabel('Ordenar por:')).toHaveValue('recent')
})

test('catálogo sem nenhum NFT mostra o estado vazio', async ({ page }) => {
  await openApp(page, '/?scenario=empty-catalog')

  await expect(catalog(page).section.getByText('Nenhum NFT encontrado')).toBeVisible()
  await expect(catalog(page).section.getByText('Ainda não há NFTs listados')).toBeVisible()
})

test('resposta atrasada de uma busca antiga não substitui a mais recente', async ({ page, isMobile }) => {
  await openApp(page)
  await expectResults(page, 36)
  // A partir daqui, a primeira consulta ao catálogo demora 1,2 s e a segunda, 80 ms.
  await setScenario(page, 'out-of-order')

  await searchFor(page, isMobile, 'golden')
  await searchFor(page, isMobile, 'emerald')

  await expectResults(page, 2)
  await expect(catalog(page).cardNames).toHaveText(['Emerald Ape #042', 'Royal Emerald #003'])

  // Tempo suficiente para a resposta lenta de "golden" chegar, se não tivesse sido descartada.
  await page.waitForTimeout(1500)
  await expectResults(page, 2)
  await expect(catalog(page).cardNames).toHaveText(['Emerald Ape #042', 'Royal Emerald #003'])
})

test('carregamento lento mostra skeletons do tamanho dos cards', async ({ page }) => {
  await openApp(page, '/?scenario=slow')

  const skeleton = page.getByTestId('nft-grid-skeleton')
  await expect(skeleton).toBeVisible()
  await expect(page.getByTestId('hero-skeleton')).toBeVisible()
  const loading = await skeleton.boundingBox()

  await expectResults(page, 36)
  await expect(skeleton).toBeHidden()

  // A grade pronta ocupa o mesmo lugar e a mesma altura dos skeletons: nada se desloca.
  const loaded = await catalog(page).cards.first().locator('..').boundingBox()
  expect(Math.abs((loaded?.y ?? 0) - (loading?.y ?? -100))).toBeLessThanOrEqual(1)
  expect(Math.abs((loaded?.height ?? 0) - (loading?.height ?? -100))).toBeLessThanOrEqual(1)
})

test('falha ao carregar mostra o erro e se recupera ao tentar de novo', async ({ page }) => {
  await openApp(page, '/?scenario=server-error')

  const alert = catalog(page).section.getByRole('alert').filter({ hasText: 'Não foi possível carregar os NFTs' })
  await expect(alert).toBeVisible({ timeout: 15_000 })

  await setScenario(page, 'default')
  await alert.getByRole('button', { name: 'Tentar novamente' }).click()

  await expectResults(page, 36)
  await expect(catalog(page).cards).toHaveCount(9)
})

test('falha transitória é repetida sozinha e o catálogo carrega', async ({ page }) => {
  await openApp(page, '/?scenario=flaky')

  await expectResults(page, 36)
  await expect(catalog(page).section.getByRole('alert')).toHaveCount(0)
})

test('mudança de preço pelo socket atualiza o card sem recarregar', async ({ page }) => {
  await openApp(page)
  const card = catalog(page).cards.filter({ hasText: 'Emerald Ape #042' })
  await expect(card).toContainText('1.19 ETH')

  await mockControl(page, 'updateEdition', {
    nftId: 'emerald-ape-042',
    editionId: 'limited-50',
    price: '1.5',
  })

  await expect(card).toContainText('1.50 ETH')
})

test('o card leva ao NFT; acesso direto a um NFT inexistente é tratado', async ({ page }) => {
  await openApp(page)

  await catalog(page).cards.filter({ hasText: 'Sage Nomad #009' }).getByRole('link').click()
  await expect(page).toHaveURL(/\/nft\/sage-nomad-009$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Sage Nomad #009' })).toBeVisible()

  await page.goBack()
  await expectResults(page, 36)

  await openApp(page, '/nft/nao-existe')
  await expect(page.getByRole('heading', { level: 1, name: 'NFT não encontrado' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao catálogo' }).click()
  await expectResults(page, 36)
})

test('rota inexistente acessada direto mostra 404 e permite voltar', async ({ page }) => {
  await page.goto('/rota/que-nao-existe')

  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao início' }).click()
  await expect(page).toHaveURL('/')
  await expectResults(page, 36)
})

test('filtros do mobile abrem em diálogo com foco controlado', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'O painel de filtros só existe no mobile')
  await openApp(page)

  const trigger = page.getByRole('button', { name: 'Abrir filtros' })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Filtros' })
  await expect(dialog).toBeVisible()
  // O foco entra no diálogo e não escapa para a página por baixo.
  await expect(dialog.locator(':focus')).toHaveCount(1)
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.locator(':focus')).toHaveCount(1)

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('itens fora do escopo não aparentam funcionar', async ({ page, isMobile }) => {
  await openApp(page)

  if (!isMobile) {
    const nav = page.getByRole('navigation', { name: 'Principal' })
    await expect(nav.getByRole('link', { name: /Criadores|Aprenda/ })).toHaveCount(0)
    await expect(nav.getByText('Criadores')).toHaveAttribute('aria-disabled', 'true')
  }

  await page.getByLabel('Seu e-mail').fill('ana@kurio.test')
  await page.getByRole('button', { name: 'Enviar' }).click()
  await expect(page.getByText('A inscrição por e-mail não está disponível nesta demonstração.')).toBeVisible()
})

test('não há overflow horizontal na página inicial', async ({ page }) => {
  await openApp(page)
  await expectResults(page, 36)

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBe(0)
})
