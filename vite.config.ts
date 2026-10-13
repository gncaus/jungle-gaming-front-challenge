import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite'

/**
 * O ponto de entrada importa a aplicação e a API simulada com `import()`, e o Vite só
 * anuncia no HTML os chunks de importação estática. Este plugin acrescenta
 * `<link rel="modulepreload">` para esses chunks (e o da página inicial, que o router também
 * carrega sob demanda) e suas dependências, para o navegador baixá-los junto com o HTML,
 * em paralelo, em vez de descobri-los um depois do outro.
 */
function preloadDynamicEntries(modules: string[]): Plugin {
  return {
    name: 'kurio:preload-dynamic-entries',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, { bundle }) {
        const files = new Set<string>()
        for (const output of Object.values(bundle ?? {})) {
          if (output.type !== 'chunk') continue
          const source = output.facadeModuleId?.replaceAll('\\', '/') ?? ''
          if (modules.some((module) => source.includes(module))) {
            files.add(output.fileName)
            output.imports.forEach((imported) => files.add(imported))
          }
        }
        return [...files].map(
          (fileName): HtmlTagDescriptor => ({
            tag: 'link',
            // Prioridade baixa: o download começa cedo, mas não disputa banda com o CSS e a
            // fonte de que a primeira pintura (a tela de carregamento do index.html) precisa.
            attrs: { rel: 'modulepreload', crossorigin: true, fetchpriority: 'low', href: `/${fileName}` },
            injectTo: 'head',
          }),
        )
      },
    },
  }
}

export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    preloadDynamicEntries(['src/app/bootstrap.tsx', 'src/mocks/browser.ts', 'src/routes/index.tsx']),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // A API simulada não usa cookies: ver o comentário no arquivo substituto.
      'tough-cookie': fileURLToPath(new URL('./src/mocks/cookie-store-stub.ts', import.meta.url)),
    },
  },
  preview: { port: 4173, strictPort: true },
})
