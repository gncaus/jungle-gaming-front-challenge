# Status

Atualizado em 13/10/2026, ao fim da fatia 1.

## Feito

**Fatia 1 — setup, tokens e base de deploy**

- Projeto Vite + React + TypeScript strict, ESLint e os sete scripts obrigatórios.
- TanStack Router por arquivo (raiz, home provisória e 404), TanStack Query e instância única do Axios.
- Tailwind v4 com os tokens do Figma em `src/styles.css`; shadcn/ui configurado, com `Button` adaptado.
- Roboto Mono servida do repositório.
- MSW ligado em dev e no build, com um handler de saúde (`GET /api/health`).
- Playwright (desktop 1440 e mobile 390) com teste de fumaça: 6 testes passando.
- Script do Lighthouse funcionando, por enquanto só com a página inicial.
- `vercel.json` com reescrita de SPA.
- Deploy na Vercel em https://jungle-gaming-front-challenge.vercel.app, publicado a cada push em `main`. Os 6 testes de fumaça passam contra a URL pública (mock pelo service worker e acesso direto a rota profunda).

## Em andamento

Nada.

## Próximo passo

Fatia 2: contratos (zod) e backend MSW — banco em memória com persistência e reset, fixtures (30+ NFTs, 2 usuários, cupons), handlers por recurso, cenários e idempotência de pedidos.

## Decisões

- Rotas por arquivo; Tailwind v4.
- Carrinho sempre via REST, inclusive para visitante: o cliente envia um `guestId` em um header, o mock guarda carrinhos por dono e mescla o do visitante no login.
- MSW 2 e TypeScript 6.0 fixados por compatibilidade (motivos no `ARCHITECTURE.md`).
- Os testes E2E rodam contra o build de produção, não contra o servidor de desenvolvimento.

## Pendências

- **Lighthouse mobile:** 93 de Performance com a página ainda vazia (LCP de 2,9 s). O custo vem do JavaScript inicial e do MSW carregado antes do primeiro render. Precisa de atenção antes de a home ganhar imagens.
- **Relatórios do Lighthouse:** `lighthouse/reports/` está no `.gitignore` durante o desenvolvimento. Na entrega final, remover essa linha e versionar os relatórios.
- **Feature `system`** (`/api/health` e o aviso "API simulada: conectada" na home): é provisória e sai quando o catálogo entrar na fatia 4.
- **Imagens dos NFTs:** os quatro originais (1000×1000) exportados do Figma estão em `src/assets/nfts/`. Falta gerar as variantes otimizadas quando o catálogo for implementado.
- **Detalhe do NFT** ainda não está na lista de páginas do Lighthouse (`lighthouse/config.mjs`).
