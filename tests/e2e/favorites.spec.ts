import { expect, test, type Page } from '@playwright/test'
import { openApp, setScenario, users } from './support/api'
import { catalog } from './support/catalog'
import { authDialog, signIn, submitLogin } from './support/session'

const goldenBeat = { path: '/nft/golden-beat-207', name: 'Golden Beat #207' }
const neonVessel = { path: '/nft/neon-vessel-552', name: 'Neon Vessel #552' }

/** Botão de favoritar do NFT aberto: com texto em telas largas, só ícone no mobile. */
function favoriteButton(page: Page, nftName: string) {
  return page
    .getByRole('main')
    .getByRole('button', { name: new RegExp(`^Favorit(ar|ado) ${nftName}$`) })
    .filter({ visible: true })
}

const announcer = (page: Page) => page.getByTestId('announcer')

test('visitante que favorita entra na conta e o favorito é concluído', async ({ page }) => {
  await openApp(page, goldenBeat.path)
  const button = favoriteButton(page, goldenBeat.name)
  await expect(button).toHaveAttribute('aria-pressed', 'false')

  await button.click()
  await expect(authDialog(page)).toBeVisible()
  await submitLogin(page, users.ana)

  await expect(authDialog(page)).toBeHidden()
  await expect(page).toHaveURL(goldenBeat.path)
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await expect(announcer(page)).toHaveText(`${goldenBeat.name} adicionado aos favoritos.`)

  await page.reload()
  await expect(favoriteButton(page, goldenBeat.name)).toHaveAttribute('aria-pressed', 'true')
})

test('desistir do login também desiste do favorito', async ({ page, isMobile }) => {
  await openApp(page, goldenBeat.path)
  await favoriteButton(page, goldenBeat.name).click()
  // O diálogo é carregado sob demanda: só existe para receber o Esc depois de aparecer.
  await expect(authDialog(page)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(authDialog(page)).toBeHidden()
  await expect(page).not.toHaveURL(/favoritar=/)

  await signIn(page, isMobile, users.ana)
  await expect(favoriteButton(page, goldenBeat.name)).toHaveAttribute('aria-pressed', 'false')
})

test('favoritar e desfavoritar persistem para o usuário', async ({ page, isMobile }) => {
  await openApp(page, neonVessel.path)
  await signIn(page, isMobile, users.ana)

  // Neon Vessel já é favorito da Ana no estado inicial.
  const button = favoriteButton(page, neonVessel.name)
  await expect(button).toHaveAttribute('aria-pressed', 'true')

  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'false')
  await expect(announcer(page)).toHaveText(`${neonVessel.name} removido dos favoritos.`)

  await page.reload()
  await expect(favoriteButton(page, neonVessel.name)).toHaveAttribute('aria-pressed', 'false')
})

test('falha ao favoritar desfaz a mudança otimista e a ação pode ser repetida', async ({
  page,
  isMobile,
}) => {
  await openApp(page, goldenBeat.path)
  await signIn(page, isMobile, users.ana)
  const button = favoriteButton(page, goldenBeat.name)
  await expect(button).toHaveAttribute('aria-pressed', 'false')

  // Neste cenário a API demora 0,6 s e responde com erro.
  await setScenario(page, 'favorites-failure')
  await button.click()

  // A tela muda antes de a API responder…
  await expect(button).toHaveAttribute('aria-pressed', 'true', { timeout: 400 })
  // …e volta atrás quando a resposta de erro chega.
  await expect(button).toHaveAttribute('aria-pressed', 'false')
  await expect(announcer(page)).toContainText(`Não foi possível favoritar ${goldenBeat.name}. Tente novamente.`)

  await setScenario(page, 'default')
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await expect(announcer(page)).toHaveText(`${goldenBeat.name} adicionado aos favoritos.`)

  await page.reload()
  await expect(favoriteButton(page, goldenBeat.name)).toHaveAttribute('aria-pressed', 'true')
})

test('favoritos de um usuário não aparecem para o seguinte', async ({ page, isMobile }) => {
  await openApp(page, neonVessel.path)
  await signIn(page, isMobile, users.ana)
  await expect(favoriteButton(page, neonVessel.name)).toHaveAttribute('aria-pressed', 'true')

  await page.goto('/perfil')
  await page.getByRole('main').getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL('/')

  await page.goto(neonVessel.path)
  await expect(favoriteButton(page, neonVessel.name)).toHaveAttribute('aria-pressed', 'false')

  await signIn(page, isMobile, users.bruno)
  await expect(favoriteButton(page, neonVessel.name)).toHaveAttribute('aria-pressed', 'false')
})

test('o coração do card favorita direto no catálogo', async ({ page, isMobile }) => {
  await openApp(page)
  await signIn(page, isMobile, users.bruno)

  const card = catalog(page).cards.filter({ hasText: 'Sage Nomad #009' })
  const heart = card.getByRole('button', { name: 'Favoritar Sage Nomad #009' })
  await expect(heart).toHaveAttribute('aria-pressed', 'false')

  await heart.click()
  await expect(heart).toHaveAttribute('aria-pressed', 'true')
  await expect(page).toHaveURL('/')

  await page.goto('/nft/sage-nomad-009')
  await expect(favoriteButton(page, 'Sage Nomad #009')).toHaveAttribute('aria-pressed', 'true')
})
