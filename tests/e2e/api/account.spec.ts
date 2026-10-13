import { expect, test } from '@playwright/test'
import { api, login, openApi, reloadApp, users } from '../support/api'

interface ProfileBody {
  displayName: string
  username: string
  email: string
  ensName: string
  walletNickname: string
  avatarUrl: string | null
}
interface ErrorBody {
  code: string
  fields?: Record<string, string>
}
interface WalletBody {
  address: string
  provider: string
  connection: string
}
interface WalletsBody {
  primary: WalletBody | null
  secondary: WalletBody | null
}

/** PNG transparente de 1×1 pixel. */
const tinyPng =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

const validWallet = {
  displayName: 'Bruno Tavares',
  nickname: 'Carteira do dia a dia',
  network: 'polygon',
  profileName: 'Bruno NFT',
  address: '0x1234567890abcdef1234567890ABCDEF12345678',
  secondaryAddress: '',
  provider: 'coinbase',
  referralCode: 'AMIGO-01',
  email: 'bruno@kurio.test',
  ensName: 'brunonft',
}

test.beforeEach(async ({ page }) => {
  await openApi(page)
})

test('perfil: edição persiste após refresh e valida campos', async ({ page }) => {
  const token = await login(page, users.ana)

  const initial = await api<ProfileBody>(page, 'GET', '/profile', { token })
  expect(initial.body).toMatchObject({ displayName: 'Ana Ribeiro', ensName: 'anaribeiro', avatarUrl: null })

  const update = {
    displayName: 'Ana R. Colecionadora',
    username: 'ana.arte',
    email: 'Ana.Arte@kurio.test',
    ensName: 'anaarte',
    walletNickname: 'Cofre novo',
  }
  const saved = await api<ProfileBody>(page, 'PATCH', '/profile', { token, body: update })
  expect(saved.status).toBe(200)
  expect(saved.body).toMatchObject({ ...update, email: 'ana.arte@kurio.test' })

  await reloadApp(page)
  const afterReload = await api<ProfileBody>(page, 'GET', '/profile', { token })
  expect(afterReload.body.displayName).toBe('Ana R. Colecionadora')

  // A sessão reflete o perfil atualizado.
  const session = await api<{ user: { username: string } }>(page, 'GET', '/auth/session', { token })
  expect(session.body.user.username).toBe('ana.arte')

  const invalid = await api<ErrorBody>(page, 'PATCH', '/profile', {
    token,
    body: { ...update, displayName: 'A', email: 'invalido', ensName: 'Com Espaço' },
  })
  expect(invalid.status).toBe(422)
  expect(Object.keys(invalid.body.fields ?? {}).sort()).toEqual(['displayName', 'email', 'ensName'])

  const conflict = await api<ErrorBody>(page, 'PATCH', '/profile', {
    token,
    body: { ...update, email: users.bruno.email, username: 'bruno.nft' },
  })
  expect([conflict.status, conflict.body.code]).toEqual([409, 'ACCOUNT_CONFLICT'])
  expect(Object.keys(conflict.body.fields ?? {}).sort()).toEqual(['email', 'username'])
})

test('avatar: envio, remoção e arquivo inválido', async ({ page }) => {
  const token = await login(page, users.ana)

  const uploaded = await api<ProfileBody>(page, 'PUT', '/profile/avatar', {
    token,
    body: { dataUrl: tinyPng },
  })
  expect(uploaded.body.avatarUrl).toBe(tinyPng)

  await reloadApp(page)
  expect((await api<ProfileBody>(page, 'GET', '/profile', { token })).body.avatarUrl).toBe(tinyPng)

  const invalid = await api<ErrorBody>(page, 'PUT', '/profile/avatar', {
    token,
    body: { dataUrl: 'data:text/html;base64,PGgxPm9pPC9oMT4=' },
  })
  expect(invalid.status).toBe(422)
  expect(invalid.body.fields).toHaveProperty('dataUrl')

  const removed = await api<ProfileBody>(page, 'DELETE', '/profile/avatar', { token })
  expect(removed.body.avatarUrl).toBeNull()
})

test('senha: valida a atual, troca e passa a valer no login', async ({ page }) => {
  const token = await login(page, users.ana)
  const otherSession = await login(page, users.ana)
  const newPassword = 'NovaSenha#2026'

  const wrongCurrent = await api<ErrorBody>(page, 'PUT', '/profile/password', {
    token,
    body: { currentPassword: 'errada-123', newPassword, confirmPassword: newPassword },
  })
  expect(wrongCurrent.status).toBe(422)
  expect(wrongCurrent.body.fields).toHaveProperty('currentPassword')

  const mismatch = await api<ErrorBody>(page, 'PUT', '/profile/password', {
    token,
    body: { currentPassword: users.ana.password, newPassword, confirmPassword: 'diferente-1' },
  })
  expect(mismatch.body.fields).toHaveProperty('confirmPassword')

  const weak = await api<ErrorBody>(page, 'PUT', '/profile/password', {
    token,
    body: { currentPassword: users.ana.password, newPassword: 'fraca', confirmPassword: 'fraca' },
  })
  expect(weak.body.fields).toHaveProperty('newPassword')

  const changed = await api(page, 'PUT', '/profile/password', {
    token,
    body: { currentPassword: users.ana.password, newPassword, confirmPassword: newPassword },
  })
  expect(changed.status).toBe(204)

  // A sessão que trocou a senha continua; a outra é encerrada.
  expect((await api(page, 'GET', '/auth/session', { token })).status).toBe(200)
  expect((await api(page, 'GET', '/auth/session', { token: otherSession })).status).toBe(401)

  const oldLogin = await api<ErrorBody>(page, 'POST', '/auth/login', {
    body: { email: users.ana.email, password: users.ana.password },
  })
  expect(oldLogin.status).toBe(401)
  await login(page, { email: users.ana.email, password: newPassword })

  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }))
  expect(stored).not.toContain(newPassword)
})

test('carteiras: cadastro, validação, conexão e edição da principal e da secundária', async ({ page }) => {
  const token = await login(page, users.bruno)

  expect((await api<WalletsBody>(page, 'GET', '/wallets', { token })).body).toEqual({
    primary: null,
    secondary: null,
  })

  const invalid = await api<ErrorBody>(page, 'PUT', '/wallets/primary', {
    token,
    body: { ...validWallet, address: '0x123', network: 'bitcoin', referralCode: '' },
  })
  expect(invalid.status).toBe(422)
  expect(Object.keys(invalid.body.fields ?? {}).sort()).toEqual(['address', 'network', 'referralCode'])

  const saved = await api<WalletsBody>(page, 'PUT', '/wallets/primary', { token, body: validWallet })
  expect(saved.status).toBe(200)
  expect(saved.body.primary).toMatchObject({ provider: 'coinbase', connection: 'disconnected' })

  const connected = await api<WalletsBody>(page, 'POST', '/wallets/primary/connect', { token })
  expect(connected.body.primary?.connection).toBe('connected')

  // Editar um campo que não identifica a conta mantém a conexão.
  const renamed = await api<WalletsBody>(page, 'PUT', '/wallets/primary', {
    token,
    body: { ...validWallet, nickname: 'Carteira renomeada' },
  })
  expect(renamed.body.primary?.connection).toBe('connected')

  // Trocar o endereço exige conectar de novo.
  const newAddress = '0xABCDEFabcdef1234567890abcdef1234567890AB'
  const moved = await api<WalletsBody>(page, 'PUT', '/wallets/primary', {
    token,
    body: { ...validWallet, address: newAddress },
  })
  expect(moved.body.primary).toMatchObject({ address: newAddress, connection: 'disconnected' })

  const secondary = await api<WalletsBody>(page, 'PUT', '/wallets/secondary', {
    token,
    body: { ...validWallet, nickname: 'Reserva', provider: 'metamask' },
  })
  expect(secondary.body.secondary).toMatchObject({ provider: 'metamask' })

  await reloadApp(page)
  const afterReload = await api<WalletsBody>(page, 'GET', '/wallets', { token })
  expect(afterReload.body.primary?.address).toBe(newAddress)
  expect(afterReload.body.secondary).not.toBeNull()

  expect((await api(page, 'PUT', '/wallets/terceira', { token, body: validWallet })).status).toBe(404)
  expect((await api(page, 'GET', '/wallets')).status).toBe(401)

  // As carteiras de um usuário não aparecem para outro.
  const ana = await login(page, users.ana)
  const anaWallets = await api<WalletsBody>(page, 'GET', '/wallets', { token: ana })
  expect(anaWallets.body.primary?.address).toBe('0x7A42c0ffee254729296a45a3885639AC7E1019E8')
  expect(anaWallets.body.secondary).toBeNull()
})
