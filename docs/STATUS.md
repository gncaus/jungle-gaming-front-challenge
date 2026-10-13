# Status

Atualizado em 13/10/2026, ao fim da fatia 3.

## Feito

**Fatia 1 — setup, tokens e base de deploy**

- Projeto Vite + React + TypeScript strict, ESLint e os sete scripts obrigatórios.
- TanStack Router por arquivo (raiz, home provisória e 404), TanStack Query e instância única do Axios.
- Tailwind v4 com os tokens do Figma em `src/styles.css`; shadcn/ui configurado, com `Button` adaptado.
- Roboto Mono servida do repositório.
- Playwright (desktop 1440 e mobile 390) e script do Lighthouse.
- Deploy na Vercel em https://jungle-gaming-front-challenge.vercel.app, publicado a cada push em `main`.

**Fatia 2 — contratos e backend simulado**

- Contratos zod de todas as features em `src/features/<feature>/schemas.ts` e contrato de erro único em `src/shared/lib/api-error.ts`.
- Dinheiro como string decimal com `decimal.js` (`src/shared/lib/money.ts`).
- Banco simulado com persistência em `localStorage`, semente e reset.
- Fixtures: 36 NFTs (9 coleções, 3 redes, 4 edições cada), 2 usuários com senha em hash, 3 cupons.
- Handlers de sessão, NFTs, favoritos, carrinho, cotação, pedidos, perfil e carteiras.
- 15 cenários selecionáveis por URL ou por `window.__mockControl`.
- Imagens: 36 variantes WebP geradas a partir dos 4 originais (`scripts/optimize-images.mjs`).
- 44 testes de contrato passando pelo service worker do MSW (`tests/e2e/api/`), mais os 6 de fumaça.

**Fatia 3 — spike de Socket.IO**

- Servidor Socket.IO simulado com o `ws` do MSW e o `@mswjs/socket.io-binding` (`src/mocks/socket/`).
- Eventos `nft.updated` e `order.updated` no envelope combinado, com schema zod em `src/features/realtime/schemas.ts`.
- Ponto único de mudança de versão (`src/mocks/db/changes.ts`): o que muda no banco sai em REST e em evento.
- `order.updated` só para o dono do pedido; `nft.updated` para todos.
- Timer de resolução de pedido, com lock entre abas.
- Cliente `socket.io-client` em `src/app/socket.ts`; a home provisória mostra a conexão e o último evento.
- `__mockControl` derruba conexões, tira o socket do ar e reenvia eventos.
- 8 testes novos de tempo real; 60 no total.

## Em andamento

Nada.

## Próximo passo

Fatia 4: layout base (cabeçalho, rodapé, navegação mobile) e catálogo com busca, filtros, ordenação e paginação na URL. A feature provisória `system` sai nesta fatia.

## Decisões

- Rotas por arquivo; Tailwind v4.
- Carrinho sempre via REST, inclusive para visitante. A mescla acontece dentro do login e do cadastro, que recebem o `X-Guest-Id`; não há endpoint separado de mescla.
- MSW 2 e TypeScript 6.0 fixados por compatibilidade (motivos no `ARCHITECTURE.md`).
- Os testes E2E rodam contra o build de produção, não contra o servidor de desenvolvimento.
- A cotação não é guardada no mock: `version` é uma impressão digital dos valores, e o pedido é validado recalculando a cotação.
- O estoque só é baixado na confirmação do pedido, não na criação. Se a edição esgotar nesse intervalo, o pedido é recusado.
- O formulário de pagamento do layout tem os mesmos campos da tela de carteiras. O pedido referencia a carteira cadastrada (`walletSlot`), e o checkout salva a carteira antes de criar o pedido.
- Login e cadastro são um diálogo sobre a tela inicial no layout, não páginas. A proteção de rotas da fatia 5 vai abrir o diálogo com o endereço de retorno.
- O socket usa o caminho `/realtime/` e só o transporte WebSocket; os motivos estão em "Tempo real" no `ARCHITECTURE.md`.
- Eventos não cruzam abas do navegador: fica como limitação documentada.

## Pendências

- **Lighthouse mobile:** 93 de Performance com a página ainda vazia (LCP de 2,9 s). O custo vem do JavaScript inicial e do MSW carregado antes do primeiro render. Precisa de atenção antes de a home ganhar imagens.
- **Relatórios do Lighthouse:** `lighthouse/reports/` está no `.gitignore` durante o desenvolvimento. Na entrega final, remover essa linha e versionar os relatórios.
- **Feature `system`** (`/api/health` e o aviso "API simulada: conectada" na home): é provisória e sai quando o catálogo entrar na fatia 4. Os utilitários de teste esperam esse aviso para saber que o mock assumiu (`waitForApp`), então precisam mudar junto.
- **Tempo real no cliente (fatia 8):** o transporte está provado, mas o cliente ainda não descarta duplicatas nem eventos antigos, não reconcilia por REST ao reconectar e não atualiza o cache. A conexão autenticada depende da sessão, que entra na fatia 5.
- **Tamanho do JavaScript inicial:** zod, decimal.js e socket.io-client já entram no carregamento da home. Reavaliar com o Lighthouse quando o catálogo existir.
- **Detalhe do NFT** ainda não está na lista de páginas do Lighthouse (`lighthouse/config.mjs`).
- **Login social** (Google e Facebook no layout): fora do escopo; os botões não podem aparentar sucesso.
