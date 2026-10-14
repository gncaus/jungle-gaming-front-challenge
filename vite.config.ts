import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite'

/** Chunk do componente de uma rota, como o plugin do router o nomeia ao dividir o código. */
const routeChunk = /src\/routes\/(.+)\.tsx\?tsr-split=component$/

/** `nft/$nftId` vira `^/nft/[^/]+/?$`; `index` vira `^//?$`; uma rota de layout casa também com as filhas. */
function routePattern(route: string, isLayout: boolean): string {
  const path = route
    .split('/')
    .filter((segment) => segment !== 'index')
    .map((segment) => (segment.startsWith('$') ? '[^/]+' : segment))
    .join('/')
  return `^/${path}${isLayout ? '(/|$)' : '/?$'}`
}

/**
 * O ponto de entrada importa a aplicação e a API simulada com `import()`, e o router carrega
 * o componente de cada rota sob demanda. O Vite só anuncia no HTML os chunks de importação
 * estática, então o navegador descobriria os outros um depois do outro. Este plugin acrescenta:
 *
 * - `<link rel="modulepreload">` para os chunks de `modules` e suas dependências, usados em
 *   toda página;
 * - um script curto que faz o mesmo para os chunks da rota do endereço aberto, e só dela.
 */
function preloadDynamicEntries(modules: string[]): Plugin {
  return {
    name: 'kurio:preload-dynamic-entries',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, { bundle }) {
        const chunks = Object.values(bundle ?? {}).filter((output) => output.type === 'chunk')
        const sourceOf = (chunk: (typeof chunks)[number]) => chunk.facadeModuleId?.replaceAll('\\', '/') ?? ''

        const always = new Set<string>()
        for (const chunk of chunks) {
          if (modules.some((module) => sourceOf(chunk).includes(module))) {
            always.add(chunk.fileName)
            chunk.imports.forEach((imported) => always.add(imported))
          }
        }

        const routes = chunks.flatMap((chunk) => {
          const route = routeChunk.exec(sourceOf(chunk))?.[1]
          return route ? [{ route, files: [chunk.fileName, ...chunk.imports].filter((file) => !always.has(file)) }] : []
        })
        const byRoute = routes.map(({ route, files }) => [
          routePattern(route, routes.some((other) => other.route.startsWith(`${route}/`))),
          files,
        ])

        // Prioridade baixa: o download começa cedo, mas não disputa banda com o CSS e a
        // fonte de que a primeira pintura (a tela de carregamento do index.html) precisa.
        const links = [...always].map(
          (fileName): HtmlTagDescriptor => ({
            tag: 'link',
            attrs: { rel: 'modulepreload', crossorigin: true, fetchpriority: 'low', href: `/${fileName}` },
            injectTo: 'head',
          }),
        )
        const routePreload: HtmlTagDescriptor = {
          tag: 'script',
          children: `for(const[r,fs]of ${JSON.stringify(byRoute)})if(new RegExp(r).test(location.pathname))for(const f of fs){const l=document.createElement("link");l.rel="modulepreload";l.crossOrigin="";l.fetchPriority="low";l.href="/"+f;document.head.append(l)}`,
          injectTo: 'head',
        }
        return [...links, routePreload]
      },
    },
  }
}

export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    preloadDynamicEntries(['src/app/bootstrap.tsx', 'src/mocks/browser.ts']),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // A API simulada não usa cookies: ver o comentário no arquivo substituto.
      'tough-cookie': fileURLToPath(new URL('./src/mocks/cookie-store-stub.ts', import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Sem agrupar, o bundler espalha o código comum em muitos chunks pequenos, e cada um
        // custa uma ida ao servidor. Dois grupos resolvem isso: as bibliotecas usadas em toda
        // página e o código próprio compartilhado entre a aplicação e o mock (contratos,
        // sessão, utilitários). O que é carregado sob demanda fica de fora dos dois.
        codeSplitting: {
          groups: [
            {
              name: 'vendor',
              test: /node_modules[\\/](react|react-dom|scheduler|@tanstack|axios|zod|decimal\.js|lucide-react|clsx|tailwind-merge|class-variance-authority)[\\/]/,
            },
            {
              name: 'common',
              test: /src[\\/](shared[\\/]lib|features[\\/][^\\/]+[\\/](schemas|session|search)\.ts)/,
            },
          ],
        },
      },
    },
  },
  preview: { port: 4173, strictPort: true },
})
