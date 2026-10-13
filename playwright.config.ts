import { defineConfig, devices } from '@playwright/test'

/** Defina PW_BASE_URL para rodar a suíte contra um ambiente já publicado. */
const externalBaseUrl = process.env.PW_BASE_URL
const localBaseUrl = 'http://localhost:4173'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: {
    // Tolerância só para ruído de antialiasing. Em uma captura de página inteira, 0,05% já é
    // menos que um botão pequeno, então qualquer mudança visível reprova.
    toHaveScreenshot: { maxDiffPixelRatio: 0.0005 },
  },
  use: {
    baseURL: externalBaseUrl ?? localBaseUrl,
    trace: 'retain-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      // Os testes de contrato da API não dependem de viewport: rodam só no projeto desktop.
      testIgnore: /[\\/]api[\\/]/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: 'npm run build && npm run preview',
        url: localBaseUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
