import { expect, test } from '@playwright/test'
import { api, login, mockControl, openApp, reloadApp, users } from '../support/api'

interface AuthBody {
  token: string
  expiresAt: string
  user: { id: string; username: string; email: string }
}
interface ErrorBody {
  code: string
  fields?: Record<string, string>
}

test.beforeEach(async ({ page }) => {
  await openApp(page)
})

test('cadastro cria conta, abre sessão e não guarda a senha em claro', async ({ page }) => {
  const created = await api<AuthBody>(page, 'POST', '/auth/register', {
    body: {
      username: 'carla.arte',
      email: 'Carla@Kurio.test',
      password: 'Segredo#789',
      confirmPassword: 'Segredo#789',
    },
  })
  expect(created.status).toBe(201)
  expect(created.body.user).toMatchObject({ username: 'carla.arte', email: 'carla@kurio.test' })

  const session = await api<{ user: { id: string } }>(page, 'GET', '/auth/session', {
    token: created.body.token,
  })
  expect(session.status).toBe(200)
  expect(session.body.user.id).toBe(created.body.user.id)

  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }))
  expect(stored).toContain('carla@kurio.test')
  expect(stored).not.toContain('Segredo#789')
  expect(stored).not.toContain(users.ana.password)
})

test('cadastro valida campos e trata conflito de e-mail e usuário', async ({ page }) => {
  const invalid = await api<ErrorBody>(page, 'POST', '/auth/register', {
    body: { username: 'x', email: 'sem-arroba', password: 'curta', confirmPassword: 'outra' },
  })
  expect(invalid.status).toBe(422)
  expect(invalid.body.code).toBe('VALIDATION_ERROR')
  expect(Object.keys(invalid.body.fields ?? {}).sort()).toEqual([
    'confirmPassword',
    'email',
    'password',
    'username',
  ])

  const conflict = await api<ErrorBody>(page, 'POST', '/auth/register', {
    body: {
      username: 'BRUNO.nft',
      email: 'ana@kurio.test',
      password: 'Segredo#789',
      confirmPassword: 'Segredo#789',
    },
  })
  expect(conflict.status).toBe(409)
  expect(conflict.body.code).toBe('ACCOUNT_CONFLICT')
  expect(Object.keys(conflict.body.fields ?? {}).sort()).toEqual(['email', 'username'])
})

test('login recusa credenciais erradas e logout encerra a sessão', async ({ page }) => {
  const wrong = await api<ErrorBody>(page, 'POST', '/auth/login', {
    body: { email: users.ana.email, password: 'senha-errada-1' },
  })
  expect(wrong.status).toBe(401)
  expect(wrong.body.code).toBe('INVALID_CREDENTIALS')

  const token = await login(page, users.ana)
  expect((await api(page, 'GET', '/auth/session', { token })).status).toBe(200)

  expect((await api(page, 'POST', '/auth/logout', { token })).status).toBe(204)

  const after = await api<ErrorBody>(page, 'GET', '/auth/session', { token })
  expect(after.status).toBe(401)
  expect(after.body.code).toBe('UNAUTHENTICATED')
})

test('sessão sobrevive a refresh e expira pelo tempo', async ({ page }) => {
  const token = await login(page, users.ana)

  await reloadApp(page)
  expect((await api(page, 'GET', '/auth/session', { token })).status).toBe(200)

  await mockControl(page, 'expireSessions')
  const expired = await api<ErrorBody>(page, 'GET', '/auth/session', { token })
  expect(expired.status).toBe(401)
  expect(expired.body.code).toBe('SESSION_EXPIRED')
})

test('recurso privado sem sessão responde 401', async ({ page }) => {
  const response = await api<ErrorBody>(page, 'GET', '/favorites')
  expect(response.status).toBe(401)
  expect(response.body.code).toBe('UNAUTHENTICATED')
})

test('favoritos persistem e ficam isolados por usuário', async ({ page }) => {
  const ana = await login(page, users.ana)
  const bruno = await login(page, users.bruno)

  const initial = await api<{ nftIds: string[] }>(page, 'GET', '/favorites', { token: ana })
  expect(initial.body.nftIds).toEqual(['neon-vessel-552', 'royal-emerald-003'])

  const added = await api<{ nftIds: string[] }>(page, 'PUT', '/favorites/golden-beat-207', {
    token: bruno,
  })
  expect(added.body.nftIds).toEqual(['golden-beat-207'])

  const removed = await api<{ nftIds: string[] }>(page, 'DELETE', '/favorites/neon-vessel-552', {
    token: ana,
  })
  expect(removed.body.nftIds).toEqual(['royal-emerald-003'])

  await reloadApp(page)
  const anaAfter = await api<{ nftIds: string[] }>(page, 'GET', '/favorites', { token: ana })
  const brunoAfter = await api<{ nftIds: string[] }>(page, 'GET', '/favorites', { token: bruno })
  expect(anaAfter.body.nftIds).toEqual(['royal-emerald-003'])
  expect(brunoAfter.body.nftIds).toEqual(['golden-beat-207'])

  const missing = await api<ErrorBody>(page, 'PUT', '/favorites/nao-existe', { token: ana })
  expect(missing.status).toBe(404)
})
