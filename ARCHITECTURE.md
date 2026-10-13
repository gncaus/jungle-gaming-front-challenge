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
  mocks/        tudo o que é simulado: fixtures, banco, regras de negócio, handlers e cenários
tests/e2e/      Playwright (api/ testa os contratos; support/ tem os utilitários)
lighthouse/     configuração e script da auditoria
scripts/        geração das imagens otimizadas
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

### Organização dos mocks

```
src/mocks/
  fixtures/   dados iniciais: 36 NFTs, 2 usuários, 3 cupons, coleções, redes e imagens
  db/         estado em memória gravado no localStorage, semente e reset
  domain/     regras de negócio simuladas: catálogo, carrinho, cotação, pedidos, sessão, senha
  handlers/   uma rota por operação; `route.ts` aplica cenário, latência e contrato de erro
  scenarios/  cenários selecionáveis e o estado do cenário ativo
  socket/     servidor Socket.IO simulado, que emite os eventos em tempo real
  control.ts  `window.__mockControl`, para testes e demonstração
```

- **Persistência:** o banco inteiro é gravado no `localStorage` a cada alteração, então sobrevive a refresh. `schemaVersion` descarta estados gravados em um formato antigo.
- **Reset:** `window.__mockControl.reset()` restaura a semente e o cenário padrão. Sessões, carrinhos, pedidos e alterações de catálogo voltam ao estado inicial.
- **Relógio:** expiração de sessão, validade de cupom e resolução de pedido leem `Date.now()` da página, que os testes controlam com `page.clock`.
- **Determinismo:** ids vêm de um contador (`ord_3`), a latência variável usa um gerador com semente fixa e o hash de transação é derivado do id do pedido.

### Cenários

O cenário ativo é escolhido por `?scenario=<nome>` na URL ou por `window.__mockControl.setScenario('<nome>')`. A escolha fica no `localStorage` e vale até ser trocada ou até o reset. A lista com o efeito de cada um está no README.

Cada cenário é um objeto de configuração (`scenarios/config.ts`) que a camada de rotas consulta. Não existe ramo de cenário em componente, hook ou Axios.

## Contratos REST

Todos os contratos são schemas zod em `src/features/<feature>/schemas.ts`. Os handlers do mock tipam suas respostas com os mesmos tipos e validam as entradas com os mesmos schemas que a interface usa.

Base: `/api`. Autenticação: `Authorization: Bearer <token>`. Visitante: `X-Guest-Id: <uuid>`.

| Recurso | Operação | Acesso |
| --- | --- | --- |
| Sessão | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout` | público |
| | `GET /auth/session` | autenticado |
| NFTs | `GET /nfts`, `GET /nfts/facets`, `GET /nfts/:id` | público |
| Favoritos | `GET /favorites`, `PUT /favorites/:nftId`, `DELETE /favorites/:nftId` | autenticado |
| Carrinho | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:itemId`, `DELETE /cart/items/:itemId` | visitante ou autenticado |
| Cotação | `POST /quotes` | visitante ou autenticado |
| Pedidos | `POST /orders` (header `Idempotency-Key`), `GET /orders`, `GET /orders/:id` | autenticado |
| Perfil | `GET /profile`, `PATCH /profile`, `PUT /profile/avatar`, `DELETE /profile/avatar`, `PUT /profile/password` | autenticado |
| Carteiras | `GET /wallets`, `PUT /wallets/:slot`, `POST /wallets/:slot/connect`, `POST /wallets/:slot/disconnect` | autenticado |

`GET /nfts` aceita `q`, `collection` e `network` (repetíveis), `minPrice`, `maxPrice`, `tab` (`all`, `new`, `trending`), `sort` (`recent`, `price-asc`, `price-desc`, `name`), `page` e `pageSize`. A busca ignora acentos e maiúsculas e olha nome, id do token e coleção.

### Erros

Toda resposta de erro tem o mesmo formato (`src/shared/lib/api-error.ts`):

```json
{ "code": "VALIDATION_ERROR", "message": "Revise os campos destacados.", "fields": { "email": "Informe um e-mail válido" } }
```

| Situação | Status | Códigos |
| --- | --- | --- |
| Validação | 422 | `VALIDATION_ERROR` (com `fields`), `COUPON_INVALID`, `COUPON_EXPIRED` |
| Sessão inválida | 401 | `UNAUTHENTICATED`, `SESSION_EXPIRED`, `INVALID_CREDENTIALS` |
| Falta de permissão | 403 | `FORBIDDEN` (ex.: pedido de outro usuário) |
| Recurso inexistente | 404 | `NOT_FOUND` |
| Conflito | 409 | `ACCOUNT_CONFLICT` (com `fields`), `INSUFFICIENT_STOCK`, `QUOTE_STALE`, `IDEMPOTENCY_CONFLICT`, `WALLET_NOT_CONNECTED`, `WALLET_REJECTED` |
| Falha transitória | 500, 503 ou erro de rede | `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE` |

`INSUFFICIENT_STOCK` traz em `details` os itens afetados e o máximo permitido. `QUOTE_STALE` traz a cotação atual.

## Dinheiro

Valores em ETH trafegam como string decimal (`"26.846"`), validados por `ethAmountSchema`, e todo cálculo usa `decimal.js`. Não há `number` para ETH em nenhuma camada. Quantidades são inteiros.

## Sessão

- Login e cadastro devolvem um token, com validade de 30 minutos controlada pelo mock.
- Token ausente significa visitante. Token inválido ou vencido responde 401 mesmo em rotas que aceitam visitante, para o cliente encerrar a sessão local em vez de seguir como visitante sem perceber.
- Senhas nunca ficam em claro: o mock guarda sal e hash PBKDF2-SHA256 (Web Crypto, 100.000 iterações), inclusive para os usuários das fixtures.
- Trocar a senha encerra as outras sessões da conta e mantém a atual.

**Limitação:** o token trafega em header e o cliente o guarda no navegador. Em produção o adequado seria um cookie `HttpOnly`, que um service worker de mock não consegue emitir.

## Carrinho

- O carrinho é sempre um recurso REST, também para o visitante. O cliente gera um `guestId`, guarda no `localStorage` e o envia em `X-Guest-Id`; o mock guarda os carrinhos por dono (`guest:<id>` ou `user:<id>`).
- No login e no cadastro, o mock passa os itens do visitante para o carrinho do usuário, somando quantidades do mesmo NFT e edição até o limite disponível, e apaga o carrinho do visitante.
- O item é o par NFT + edição. Cada edição tem preço, estoque e limite por pedido próprios.
- Cada item informa `available`, `maxQuantity` e `status`. Se o estoque cair abaixo da quantidade no carrinho, o item fica `insufficient-stock` e a cotação é recusada até o ajuste.

## Cotação e pedidos

- `POST /quotes` calcula subtotal, desconto do cupom, taxa de rede (uma por rede envolvida) e total a partir dos preços e estoques do momento. O campo `version` é uma impressão digital desses valores.
- `POST /orders` recebe a `quoteVersion` que o usuário confirmou. O mock recalcula a cotação; se a versão for outra (preço, estoque, cupom ou taxa mudaram), responde 409 `QUOTE_STALE` com a cotação atual, e a compra só segue com nova confirmação.
- **Idempotência:** a chave vem no header `Idempotency-Key`. Mesma chave e mesmo corpo devolvem o pedido já criado (200 em vez de 201); mesma chave com corpo diferente responde 409.
- **Estados:** o pedido nasce `pending` e a simulação o resolve 3 segundos depois como `confirmed` ou `declined`. Os dois últimos são terminais. A resolução depende só do horário gravado no pedido, então sobrevive a refresh e nunca acontece duas vezes (detalhes em "Tempo real").
- **Confirmação:** baixa o estoque e remove do carrinho só os itens e quantidades comprados. Na recusa o carrinho fica intacto.
- **Recibo:** é uma cópia dos itens, valores, cupom e carteira no momento da compra. Mudanças posteriores no catálogo não o alteram.
- A carteira escolhida precisa estar cadastrada e conectada. O hash da transação e o link do explorador são simulados.

## Tempo real

### Eventos

Os dois eventos usam o mesmo envelope (`src/features/realtime/schemas.ts`):

```json
{
  "id": "nft:emerald-ape-042:v2",
  "type": "nft.updated",
  "resource": "nft",
  "resourceId": "emerald-ape-042",
  "version": 2,
  "occurredAt": "2026-10-13T15:00:00.000Z",
  "payload": {}
}
```

| Evento | Quando | Destino | `payload` |
| --- | --- | --- | --- |
| `nft.updated` | Preço ou disponibilidade de um NFT mudou | Todas as conexões | Preço, preço anterior, `soldOut` e as edições com preço e estoque |
| `order.updated` | O pedido foi confirmado ou recusado | Só as conexões do dono do pedido | O pedido completo, com o recibo |

- `id` é estável: é derivado do recurso e da versão, então a reentrega do mesmo evento tem o mesmo `id`.
- `version` é a versão do recurso depois da mudança, a mesma que o REST devolve.

### Transporte

- O cliente é o `socket.io-client`, criado em `src/app/socket.ts`, na mesma origem da aplicação e com o caminho `/realtime/`.
- O servidor é simulado em `src/mocks/socket/server.ts` com o `ws` do MSW e o `@mswjs/socket.io-binding`, que codifica e decodifica os pacotes do protocolo Socket.IO.
- A autenticação usa o campo `auth` do Socket.IO: o cliente envia o token da sessão no pacote de conexão e o mock associa a conexão ao usuário.

### REST e eventos contam a mesma história

Toda mudança de versão de NFT ou de pedido passa por `src/mocks/db/changes.ts`. A mudança entra em uma fila e só vira evento depois que o banco é gravado, e o evento é montado a partir do estado gravado. Não há outro caminho para emitir evento.

Os testes e o `window.__mockControl` também seguem essa regra: alterar uma edição, derrubar conexões ou reenviar um evento acontece no servidor de socket do mock, e o que chega à interface chega pelo `socket.io-client`.

### Limitações da simulação

- **Só WebSocket.** O MSW intercepta WebSocket, mas não o long-polling com que o Socket.IO começa por padrão. Por isso o cliente usa `transports: ['websocket']`.
- **Caminho próprio.** O MSW remove o prefixo `/socket.io/` da URL antes de procurar o handler, o que faria a conexão se confundir com qualquer outro WebSocket da origem (o HMR do Vite, por exemplo). Com `/realtime/` o handler casa só com o socket da aplicação.
- **Sem salas nem broadcast.** O binding não implementa esses recursos. O mock guarda as conexões abertas e escolhe o destino de cada evento.
- **Heartbeat manual.** O binding responde ao handshake, mas não envia os pings que o cliente espera do servidor. O mock envia um ping a cada 20 s; sem isso o cliente fecharia a conexão a cada 30 s.
- **Sem reentrega.** Um evento emitido enquanto o cliente estava desconectado se perde. Depois de reconectar, o estado atual só é recuperado pela API REST.
- **Uma aba por vez.** A interceptação acontece dentro da página, não no service worker. Um evento gerado em uma aba não chega às outras. O banco é compartilhado entre abas (`localStorage`), então a outra aba vê o estado novo na próxima consulta REST.
- **Identificação na conexão.** O usuário é resolvido quando a conexão abre. Se a sessão expirar depois, a conexão continua recebendo eventos até ser encerrada; cabe ao cliente desconectar no logout e na expiração.

### Resolução de pedidos

O pedido pendente é resolvido por um timer do mock no prazo gravado no pedido, e também antes de cada requisição REST. Os dois caminhos usam a mesma função, protegida por um lock do navegador (`navigator.locks`), para que duas abas não resolvam o mesmo pedido. Ao carregar a página, o mock reagenda os pedidos que ficaram pendentes.

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
