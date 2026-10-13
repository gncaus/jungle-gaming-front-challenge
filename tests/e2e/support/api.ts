import { expect, type Page } from '@playwright/test'
import type { MockControl } from '../../../src/mocks/control-types'
import type { ScenarioName } from '../../../src/mocks/scenarios/names'

export const users = {
  ana: { id: 'usr_ana', email: 'ana@kurio.test', password: 'Kurio@123' },
  bruno: { id: 'usr_bruno', email: 'bruno@kurio.test', password: 'Kurio@456' },
} as const

export interface ApiResponse<Body> {
  /** 0 quando a requisição falhou por erro de conexão. */
  status: number
  body: Body
}

interface Identity {
  token?: string
  guestId?: string
  headers?: Record<string, string>
}

/** Espera o service worker do mock assumir as requisições da página. */
export async function waitForApp(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__mockControl?.isReady() === true)
}

/** Abre a aplicação no endereço dado, com o mock pronto. Cada teste já parte de um navegador limpo. */
export async function openApp(page: Page, url = '/'): Promise<void> {
  await page.goto(url)
  await waitForApp(page)
}

/**
 * Abre uma rota sem tela, para os testes de contrato: o mock sobe, mas a página não faz
 * nenhuma consulta por conta própria que pudesse se misturar às chamadas do teste.
 */
export async function openApi(page: Page): Promise<void> {
  await openApp(page, '/__api')
}

export async function reloadApp(page: Page): Promise<void> {
  await page.reload()
  await waitForApp(page)
}

/** Chama um método de `window.__mockControl` dentro da página. */
export async function mockControl<Method extends keyof MockControl>(
  page: Page,
  method: Method,
  ...args: Parameters<MockControl[Method]>
): Promise<void> {
  await page.evaluate(
    ([name, params]) => {
      const control = window.__mockControl
      if (!control) throw new Error('window.__mockControl não está disponível')
      const call = control[name] as (...values: unknown[]) => unknown
      call(...params)
    },
    [method, args] as const,
  )
}

export async function setScenario(page: Page, name: ScenarioName): Promise<void> {
  await mockControl(page, 'setScenario', name)
}

/**
 * Chama a API a partir da página, com `fetch`, para a requisição passar pelo
 * service worker do MSW exatamente como as chamadas da aplicação.
 */
export async function api<Body = unknown>(
  page: Page,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  options: Identity & { body?: unknown } = {},
): Promise<ApiResponse<Body>> {
  const result = await page.evaluate(
    async ({ method, path, body, token, guestId, headers }) => {
      try {
        const response = await fetch(`/api${path}`, {
          method,
          headers: {
            ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(guestId ? { 'X-Guest-Id': guestId } : {}),
            ...headers,
          },
          body: body === undefined ? undefined : JSON.stringify(body),
        })
        const text = await response.text()
        return { status: response.status, body: text ? (JSON.parse(text) as unknown) : null }
      } catch {
        return { status: 0, body: null }
      }
    },
    { method, path, ...options },
  )
  return result as ApiResponse<Body>
}

export async function login(
  page: Page,
  user: { email: string; password: string },
  identity: Identity = {},
): Promise<string> {
  const response = await api<{ token: string }>(page, 'POST', '/auth/login', {
    ...identity,
    body: { email: user.email, password: user.password },
  })
  expect(response.status).toBe(200)
  return response.body.token
}
