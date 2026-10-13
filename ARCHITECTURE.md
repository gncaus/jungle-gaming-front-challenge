# Arquitetura

Este documento cresce junto com a implementação. Cada seção descreve só o que já existe no código.

## Stack e versões

| Responsabilidade | Tecnologia |
| --- | --- |
| Build | Vite 8 |
| Interface | React 19, TypeScript 6 (strict, `noUncheckedIndexedAccess`) |
| Roteamento | TanStack Router, rotas por arquivo em `src/routes/` |
| Estado remoto | TanStack Query 5 |
| HTTP | Axios, instância única em `src/shared/lib/http.ts` |
| Validação de contratos | zod 4 |
| Estilo | Tailwind CSS 4, shadcn/ui (Radix) |
| Mocks | MSW 2 |
| Testes | Playwright |
| Auditoria | Lighthouse 13 |

Duas versões foram fixadas abaixo da mais recente por compatibilidade:

- **MSW 2**, porque o `@mswjs/socket.io-binding` (usado no tempo real) declara `msw ^2` como dependência.
- **TypeScript 6.0**, porque o `typescript-eslint` ainda não aceita o TypeScript 7.

## Organização

```
src/
  app/          providers, router e query client
  routes/       rotas por arquivo (a árvore em routeTree.gen.ts é gerada pelo plugin)
  features/<x>/ api (Axios), hooks (Query), components e schemas (zod) de cada domínio
  shared/       ui (shadcn adaptado) e lib (http, utilitários)
  mocks/        tudo o que é simulado: handlers e, adiante, banco, fixtures e cenários
tests/e2e/      Playwright
lighthouse/     configuração e script da auditoria
```

Regra de dependência: componentes usam hooks, hooks usam funções de `api/`, e só `api/` conhece o Axios. Nada fora de `src/mocks/` contém dado fictício.

## Roteamento

- Rotas por arquivo com divisão automática de código por rota (`autoCodeSplitting`).
- `routeTree.gen.ts` é gerado pelo plugin e versionado, para que `npm run typecheck` funcione em um checkout limpo sem rodar o Vite antes.
- Rota inexistente é tratada pelo `notFoundComponent` da rota raiz, inclusive em acesso direto pela URL.

## API simulada

- O MSW intercepta as chamadas no service worker (`public/mockServiceWorker.js`), então as requisições saem de verdade pelo Axios e aparecem na aba de rede.
- A ativação é por configuração: ligada por padrão, desligada com `VITE_ENABLE_MOCKS=false`. O módulo de mocks é carregado por `import()` dinâmico, fora do bundle principal.
- `src/main.tsx` aguarda o worker iniciar antes do primeiro render. Sem isso, as primeiras consultas escapariam do mock.
- Os mocks ficam ligados também no build de produção, que é o que vai para a demonstração publicada.

## Deploy

`vercel.json` reescreve qualquer caminho para `index.html`, o que permite refresh e acesso direto em rotas profundas. A Vercel serve arquivos estáticos antes de aplicar a reescrita, então `mockServiceWorker.js` continua acessível na raiz.

## Identidade visual

Os tokens vêm dos estilos locais do arquivo do Figma e estão em `src/styles.css`, no bloco `@theme`:

- **Cores:** os 18 estilos do grupo *Color* e os 4 do grupo *Text*, com os mesmos nomes do Figma. A paleta padrão do Tailwind foi removida, então só existem cores do layout.
- **Papéis do shadcn/ui** (`background`, `card`, `muted`, `accent` etc.): apontam para os tokens do Figma, o que adapta os componentes à identidade sem editar cada um.
- **Tipografia:** Roboto Mono, servida do próprio repositório (`public/fonts/`, variável, subconjunto latino) e com `preload` no `index.html`.

O layout é escuro e não há tema claro.

### Desvios do Figma

- O estilo de cor *Secondary* do Figma (`#B39463`) chama-se `brand-secondary` no código, porque `secondary` já é um papel do shadcn/ui.

## Testes

- Chromium em dois projetos: `desktop` (1440×900) e `mobile` (390×844, com toque).
- A suíte roda contra o build de produção servido por `vite preview`, o mesmo artefato que é publicado.
- Traces são guardados nas falhas e o relatório HTML é gerado em toda execução.

## Lighthouse

`npm run lighthouse` faz o build, sobe o `vite preview` em uma porta própria e audita cada página em dois perfis (mobile e desktop), três vezes cada, com um Chrome novo por execução. O script grava os relatórios HTML e JSON de cada execução e um resumo com as medianas, LCP, CLS, TBT, versões e ambiente em `lighthouse/reports/`.

A configuração versionada está em `lighthouse/config.mjs`.
