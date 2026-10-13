# Status

Atualizado em 13/10/2026, ao fim da fatia 4.

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
- Cliente `socket.io-client` em `src/app/socket.ts`.
- `__mockControl` derruba conexões, tira o socket do ar e reenvia eventos.
- 6 testes de tempo real pelo `socket.io-client`.

**Fatia 4 — layout base e catálogo**

- Cabeçalho (a partir de 768 px), rodapé e página inicial completa: hero com destaques, filtros, abas, ordenação, grade, paginação, banners e Diário da Cunhagem.
- Busca, filtros, aba, ordenação e página na URL, com restauração por refresh e histórico.
- Filtros em painel lateral no mobile, com foco controlado.
- Skeletons com shimmer nas dimensões do conteúdo; estados vazio, erro com nova tentativa e atualização em segundo plano.
- Política de consultas (cache, novas tentativas, descarte de resposta obsoleta) e `HttpError` no interceptor do Axios.
- `nft.updated` revalida o catálogo pelo REST.
- `GET /nfts/highlights` no mock.
- Interface renderiza sem esperar o mock; aplicação e mock carregam em paralelo.
- Regressão visual da página inicial em 1440 e 390 px.
- Lighthouse da página inicial (mediana de 3): mobile 93 / 100 / 100 / 100, LCP 3,1 s, CLS 0, TBT 116 ms; desktop 100 / 100 / 100 / 100, LCP 0,65 s.
- 90 testes no total (44 de interface nos dois viewports, 44 de contrato, 2 visuais), 1 pulado no desktop por ser só do mobile.

## Em andamento

Nada.

## Próximo passo

Fatia 5: detalhe do NFT (galeria, edições, quantidade), login e cadastro em diálogo, sessão, rotas protegidas com retorno e favoritos com atualização otimista.

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

- O `socket.io-client` é importado sob demanda, depois de o mock iniciar; do contrário a conexão escapa do MSW.
- A biblioteca de cookies embutida no MSW é substituída por uma versão vazia no build, porque a API não usa cookies e ela pesava 120 KB comprimidos.
- Itens do layout fora do escopo do enunciado aparecem desabilitados ou como texto, sem simular sucesso (lista no `ARCHITECTURE.md`).

## Pendências

- **Lighthouse mobile:** a página inicial está em 93 de Performance, com LCP de 3,1 s. O LCP é a imagem do primeiro card, que depende de a API simulada responder. Refazer a medição a cada fatia que mexer na página inicial.
- **Relatórios do Lighthouse:** `lighthouse/reports/` está no `.gitignore` durante o desenvolvimento. Na entrega final, remover essa linha e versionar os relatórios.
- **Navegação inferior do mobile** (início, favoritos, carrinho, perfil): entra quando os destinos existirem, nas fatias 5 e 6.
- **Cabeçalho:** faltam o carrinho com contador (fatia 6) e o botão "Entrar" (fatia 5). No mobile ainda não há cabeçalho; conferir os frames mobile das outras telas na fatia 5.
- **Card do NFT:** faltam os botões de favoritar e de adicionar ao carrinho (fatias 5 e 6).
- **Página do NFT:** hoje mostra só imagem, nome, preço e descrição. O layout completo é a fatia 5.
- **Baseline visual:** regenerar ao fim de cada fatia que mudar a página inicial.
- **Tempo real no cliente (fatia 8):** hoje o evento `nft.updated` só invalida o catálogo. Faltam descartar duplicatas e eventos antigos, reconciliar por REST ao reconectar, tratar `order.updated` e autenticar a conexão (depende da sessão, fatia 5).
- **Detalhe do NFT** ainda não está na lista de páginas do Lighthouse (`lighthouse/config.mjs`).
- **Login social** (Google e Facebook no layout): fora do escopo; os botões não podem aparentar sucesso.
