# Status

Atualizado em 13/10/2026, ao fim da fatia 10.

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

**Fatia 5 — sessão, detalhe do NFT e favoritos**

- Login e cadastro em diálogo (tela inteira no mobile), com validação por campo e erros da API.
- Sessão recuperada no refresh; expiração reabre o login e retoma a tela; logout e troca de usuário descartam os dados privados e refazem o socket.
- Rota privada `/perfil` (por enquanto só leitura e "Sair") com retorno ao destino depois do login.
- Cabeçalho com "Entrar" ou usuário; navegação inferior do mobile com Início, Explorar e Perfil.
- Detalhe do NFT: galeria, edições com preço e estoque próprios, quantidade com limite, avaliação, abas, "Mais desta coleção", skeleton, erro e atualização em tempo real.
- Favoritos com atualização otimista e desfazer em caso de falha, no detalhe e no card; visitante conclui o favorito depois de entrar.
- Aviso global com `aria-live` (`Announcer`).
- Regressão visual do detalhe; Lighthouse passa a auditar o detalhe.
- Lighthouse (mediana de 3): início mobile 92, detalhe mobile 92, ambos desktop 100; acessibilidade, boas práticas e SEO em 100 nos quatro. LCP mobile de 3,2 s nas duas páginas, CLS 0.
- 148 testes no total, 1 pulado no desktop por ser só do mobile.

**Fatia 6 — carrinho**

- Adicionar pelo detalhe ("Comprar" leva ao carrinho; o botão de carrinho fica na página) e pelo card em telas largas.
- Página `/carrinho` para visitante e usuário: quantidades com limite, remoção, estados vazio, skeleton e erro.
- Resumo sempre pela cotação da API; cupom aplicado na URL, com as recusas de inválido, expirado e abaixo do mínimo.
- Contador de itens no cabeçalho e na barra do mobile, lendo a mesma consulta da página.
- Mescla do carrinho do visitante ao entrar; carrinho vazio ao sair; isolamento entre usuários.
- Tempo real no carrinho: mudança de preço avisa e atualiza o resumo; estoque abaixo da quantidade bloqueia o total até o ajuste.
- A cada conexão do socket, catálogo, carrinho e cotação são reconciliados pela API REST.
- Regressão visual do carrinho.
- Lighthouse (mediana de 3): início e detalhe em 90 no mobile e 100 no desktop; os demais em 100.
- 176 testes no total, 1 pulado no desktop por ser só do mobile.

**Fatia 7 — pagamento, pedido e confirmação**

- Rotas privadas `/pagamento` e `/pedido/<id>`; "Conectar e finalizar" no carrinho.
- Escolha entre carteira principal e secundária, formulário de carteira validado pelo contrato, conexão simulada com recusa e desconexão.
- Revisão pela cotação; mudança de valores (por socket ou recusa do servidor) exige nova confirmação.
- Pedido idempotente: clique repetido e nova tentativa após timeout recuperam o mesmo pedido.
- Pedido pendente com retomada após refresh; recibo só com confirmação da simulação; recusa preserva o carrinho.
- Sessão expirada no pagamento devolve o usuário à tela, com carrinho e cupom.
- Regressão visual do pagamento.
- Lighthouse (mediana de 3): início mobile 90, detalhe mobile 91, ambos desktop 100.
- 204 testes no total, 1 pulado no desktop por ser só do mobile.

**Fatia 8 — tempo real completo**

- Guarda de eventos: duplicatas (por `id`) e eventos antigos (por `version`) são descartados sem refazer consultas, mudar o cache ou repetir avisos.
- `order.updated` leva o pedido ao cache e anuncia confirmação ou recusa; pedido em estado final não é alterado por evento.
- A tela do pedido deixou de consultar a API periodicamente; a consulta só volta enquanto o socket está fora do ar.
- A cada conexão, os pedidos em uso também são reconciliados pela API REST.
- O mock recusa conexões com erro quando o socket está fora do ar, o que corrigiu uma reconexão que às vezes levava 20 s (teste intermitente).
- 214 testes no total, 1 pulado no desktop por ser só do mobile.

**Fatia 9 — perfil e carteiras**

- Área do colecionador com navegação lateral (faixa de abas no mobile): `/perfil` e `/perfil/carteiras`.
- Edição dos dados com validação por campo e conflito vindo da API; o cabeçalho reflete o nome novo.
- Avatar: envio (reduzido para 256 px no navegador), remoção e recusa de arquivo que não é imagem.
- Troca de senha com conferência da senha atual pela API.
- Carteiras principal e secundária: cadastro, resumo, edição e "Igual à carteira principal".
- 224 testes no total, 1 pulado no desktop por ser só do mobile.

**Ajuste — barra inferior do mobile e favoritos**

- Barra inferior refeita conforme o frame: Início, Favoritos, botão central, Carrinho e Perfil, com ícones preenchidos e destaque na seção aberta.
- Tela `/favoritos` (privada), com `GET /favorites/nfts` no mock; no desktop, acessível por "Lista de interesse" no perfil.
- Baselines visuais do mobile regeneradas.
- 230 testes no total, 2 pulados no desktop por serem só do mobile.

**Fatia 10 — fechamento**

- Lighthouse mobile de 89–90 para 91 (início) e 92 (detalhe): primeira conexão do socket depois da primeira tela, pré-carregamento do chunk da rota aberta e cards fora da primeira linha montados em renderização interrompível. Desktop em 100; acessibilidade, boas práticas e SEO em 100 nas quatro medições.
- Relatórios do Lighthouse versionados em `lighthouse/reports/`, com análise no `ARCHITECTURE.md`.
- Os 12 cenários da seção 9 do enunciado conferidos contra a suíte (mapa abaixo).
- Cabeçalho: "Mercado" fica em destaque no detalhe, no carrinho, no pagamento e no pedido, como no layout.
- README com o passo a passo para reproduzir cada fluxo de falha.
- 230 testes no total, 2 pulados no desktop por serem só do mobile.

### Cenários da seção 9 e onde estão testados

| # | Cenário | Testes |
| --- | --- | --- |
| 1 | Busca, filtros, ordenação, paginação e histórico | `catalog.spec.ts` |
| 2 | Acesso direto ao detalhe e recurso inexistente | `detail.spec.ts`, `catalog.spec.ts` (NFT inexistente e 404) |
| 3 | Cadastro, login, expiração, logout e troca de usuário | `auth.spec.ts` |
| 4 | Favoritos, falha de mutation e recuperação | `favorites.spec.ts` |
| 5 | Carrinho, quantidades, remoção, cupom, persistência | `cart.spec.ts` |
| 6 | Compra completa até o recibo | `checkout.spec.ts` |
| 7 | Pagamento recusado, clique repetido, timeout | `checkout.spec.ts`, `realtime.spec.ts` |
| 8 | Perfil, avatar, senha e carteiras | `profile.spec.ts`, `checkout.spec.ts` (carteira no pagamento) |
| 9 | Preço e disponibilidade via Socket.IO no checkout | `checkout.spec.ts`, `cart.spec.ts` |
| 10 | Duplicados, antigos, desconexão e pedido pendente | `realtime.spec.ts`, `api/realtime.spec.ts`, `checkout.spec.ts` |
| 11 | Teclado, foco de diálogos e validação | `auth.spec.ts`, `catalog.spec.ts`, `detail.spec.ts`, `profile.spec.ts` |
| 12 | Skeletons, falha e nova tentativa | `catalog.spec.ts`, `detail.spec.ts`, `cart.spec.ts` |

**Revisão de fidelidade ao Figma**

- Comparação tela a tela com os frames, nas mesmas larguras, e com as medidas do Figma (conteúdo de 1200 px, margem mobile de 24 px, banners de 586 × 250, cards do Diário de 268 px, destaque mobile de 366 × 190).
- Mobile: barra inferior só onde o frame a tem; compra do detalhe em barra fixa no rodapé; ordenação dentro do painel de filtros; destaque compacto com a segunda arte sobreposta; voltar no pagamento.
- Detalhe: cores dos atributos, espaçamento e "Compartilhar este NFT" com links reais.
- Busca do cabeçalho aberta no lugar do menu, sem cobrir "Aprenda".
- Carrinho, recibo, perfil, carteiras, filtros e rodapé ajustados ao layout (lista abaixo no `ARCHITECTURE.md`).
- Lighthouse refeito: início mobile 90, detalhe mobile 91, desktop 100.

## Em andamento

Nada.

## Próximo passo

Entrega: enviar o repositório e a URL publicada.

O checkout limpo e o deploy final já foram conferidos.

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

- Na troca de sessão, o cache é limpo de tudo o que é privado, mas o catálogo público fica. O `CLAUDE.md` pedia `queryClient.clear()`; apagar também o catálogo deixava as telas abertas sem receber as atualizações em tempo real.
- O diálogo de login vive na URL (`?auth=`), e o favorito pedido por um visitante também (`?favoritar=`).
- A edição escolhida no detalhe vive na URL (`?edicao=`); a quantidade é estado local.

- O carrinho não usa atualização otimista: o total depende da cotação, então a tela espera a API.
- O cupom aplicado vive na URL do carrinho (`?cupom=`).
- Há tela de favoritos (`/favoritos`), criada para o coração da barra do mobile ter destino; a barra segue o frame.

- O pagamento tem três passos explícitos (salvar carteira, conectar, confirmar), com o motivo do bloqueio escrito junto do botão.
- A chave de idempotência é por conteúdo do pedido e fica no navegador, sob o id do usuário.
- A confirmação é uma página com URL própria, não um diálogo.

- `nft.updated` só invalida consultas (o estado vem do REST); `order.updated` grava o pedido do evento no cache, porque é ele que confirma a compra.
- A consulta periódica do pedido é reserva para socket fora do ar, não o caminho normal.

- Dados do perfil e senha são dois formulários, cada um com seu botão; o layout tem um só "Salvar".
- O avatar é gravado na hora, fora do "Salvar".

- A primeira conexão de tempo real da página espera 1,5 s; a reconciliação via REST na conexão cobre esse intervalo.

## Pendências

- **Lighthouse mobile:** as medianas atingem a meta (90 e 91), mas execuções isoladas variam entre 89 e 92. A causa e a análise estão no `ARCHITECTURE.md`.
- **Baseline visual:** regenerar ao fim de cada fatia que mudar a página inicial, o detalhe, o carrinho ou o pagamento.
- **Login social** (Google e Facebook no layout): fora do escopo; os botões não podem aparentar sucesso.
