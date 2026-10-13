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
  main.tsx      ponto de entrada mínimo: dispara a aplicação e a API simulada em paralelo
  app/          providers, router, query client, socket e o layout comum (cabeçalho e rodapé)
  routes/       rotas por arquivo (a árvore em routeTree.gen.ts é gerada pelo plugin)
  features/<x>/ api (Axios), hooks (Query), components e schemas (zod) de cada domínio
  shared/       ui (shadcn adaptado) e lib (http, dinheiro, utilitários)
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
- `/perfil` é uma rota de layout: a navegação da área do colecionador fica nela, e `/perfil` (dados) e `/perfil/carteiras` são rotas filhas. A proteção por sessão está no `beforeLoad` do layout e vale para as duas.

### Catálogo na URL

Busca, filtros, aba, ordenação e página vivem nos parâmetros da URL da página inicial, validados por `catalogSearchSchema` (`src/features/catalog/search.ts`) no `validateSearch` da rota.

- A URL é a única fonte desse estado: os componentes leem dela e navegam para mudá-la. Refresh, link compartilhado e os botões voltar e avançar restauram o catálogo.
- Mudar busca, filtro, aba ou ordenação navega com `page: 1`. Só a paginação mantém os demais parâmetros e troca a página.
- Valor inválido digitado na URL cai no padrão do campo, em vez de quebrar a página.
- Parâmetros com o valor padrão não aparecem na URL (`stripSearchParams`).
- A faixa de preço só vai para a URL ao clicar em "Aplicar", como no layout; os demais filtros aplicam na hora.

## Consultas, cache e sincronização

Configuração em `src/app/query-client.ts`; chaves e opções de cada consulta em `src/features/<feature>/hooks/`.

| Aspecto | Política |
| --- | --- |
| Chaves | Uma fábrica por feature (`catalogKeys`). Os parâmetros da consulta fazem parte da chave. Dados privados levarão o id do usuário na chave. |
| Tempo de cache | Dados ficam frescos por 30 s. Depois disso continuam sendo exibidos e são revalidados em segundo plano, com o aviso "atualizando…". |
| Novas tentativas | Só falha transitória (erro de conexão ou 5xx) é repetida, até 2 vezes, com espera crescente. Erro 4xx não é repetido, porque responderia igual. |
| Mutations | Nunca são repetidas automaticamente, para não duplicar operações. |
| Respostas obsoletas | Cada combinação de parâmetros tem sua chave e a requisição recebe o `signal` do Query. Ao mudar um filtro, a consulta anterior é cancelada e, mesmo que responda, não é exibida. |
| Atualização otimista | Favoritos (ver "Favoritos"). |
| Tempo real | O evento `nft.updated` invalida as consultas do catálogo, do carrinho e da cotação, que são refeitas pela API REST. O evento `order.updated` traz o pedido completo, que vai direto para o cache. Detalhes em "Tempo real". |

Erros da API chegam à interface como `HttpError` (`src/shared/lib/http.ts`), já no formato do contrato de erro. O interceptor do Axios faz essa conversão em um só lugar.

Estados de cada consulta do catálogo: carregando (skeleton com shimmer nas dimensões do conteúdo), vazio (com opção de limpar a busca), erro (com "tentar novamente") e atualização em segundo plano.

## API simulada

- O MSW intercepta as chamadas no service worker (`public/mockServiceWorker.js`), então as requisições saem de verdade pelo Axios e aparecem na aba de rede.
- A ativação é por configuração: ligada por padrão, desligada com `VITE_ENABLE_MOCKS=false`. O módulo de mocks é carregado por `import()` dinâmico, fora do bundle principal.
- A interface não espera o mock para renderizar. `src/main.tsx` dispara o carregamento da aplicação e o do mock ao mesmo tempo, e quem espera o worker iniciar são as requisições: o interceptor do Axios e a conexão de socket aguardam `backendReady()` (`src/shared/lib/backend-ready.ts`). Assim nenhuma chamada escapa do mock e a tela não fica em branco enquanto ele sobe.
- O cenário pedido em `?scenario=` é lido da URL logo no ponto de entrada, antes de o router poder reescrevê-la.
- `tough-cookie`, a biblioteca de cookies que o MSW embute, é substituída por uma versão vazia (`src/mocks/cookie-store-stub.ts`, via `resolve.alias`). A API não usa cookies, e a biblioteca traz a lista pública de sufixos de domínio: com ela o JavaScript do mock tinha 175 KB comprimidos; sem ela, 54 KB.
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
| NFTs | `GET /nfts`, `GET /nfts/facets`, `GET /nfts/highlights`, `GET /nfts/:id` | público |
| Favoritos | `GET /favorites`, `GET /favorites/nfts`, `PUT /favorites/:nftId`, `DELETE /favorites/:nftId` | autenticado |
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

## Acessibilidade

- **Teclado e foco:** todo controle é alcançável por teclado, com foco visível (contorno em `:focus-visible`). Há um link "Pular para o conteúdo" no topo.
- **Diálogos e painéis:** usam o Dialog do Radix, que prende o foco e fecha com Esc. Como são montados sob demanda, sem um gatilho que o Radix conheça, `useReturnFocus` devolve o foco a quem os abriu.
- **Formulários:** todo campo tem rótulo (visível ou só para leitor de tela, quando o layout mostra apenas o placeholder). O erro fica associado ao campo por `aria-describedby`, o campo é marcado com `aria-invalid` e o primeiro campo inválido recebe o foco.
- **Estados sem depender de cor:** filtro marcado ganha ícone e negrito; favorito muda o rótulo, o preenchimento do ícone e `aria-pressed`; edição esgotada fica riscada e é anunciada como esgotada; "RARO" e "Esgotado" são texto.
- **Feedback:** uma região `aria-live` única (`Announcer`) recebe o resultado de mutations e, adiante, as mudanças em tempo real. Estados de carregamento e contagem de resultados usam `role="status"`; erros usam `role="alert"`.
- **Imagens:** as artes têm texto alternativo descritivo; imagens decorativas têm `alt` vazio.
- **Movimento:** shimmer, transições e rolagem suave são desligados com `prefers-reduced-motion`.

## Dinheiro

Valores em ETH trafegam como string decimal (`"26.846"`), validados por `ethAmountSchema`, e todo cálculo usa `decimal.js`. Não há `number` para ETH em nenhuma camada. Quantidades são inteiros.

## Sessão

### Na API simulada

- Login e cadastro devolvem um token, com validade de 30 minutos controlada pelo mock.
- Token ausente significa visitante. Token inválido ou vencido responde 401 mesmo em rotas que aceitam visitante, para o cliente encerrar a sessão local em vez de seguir como visitante sem perceber.
- Senhas nunca ficam em claro: o mock guarda sal e hash PBKDF2-SHA256 (Web Crypto, 100.000 iterações), inclusive para os usuários das fixtures.
- Trocar a senha encerra as outras sessões da conta e mantém a atual.

### No cliente

- **Credenciais:** `src/shared/lib/credentials.ts` é o único lugar que lê e grava o token e o `guestId` do visitante, ambos no `localStorage`. O interceptor do Axios envia os dois em toda chamada.
- **Recuperação:** ao recarregar, o token guardado é confirmado em `GET /auth/session`. Enquanto a resposta não chega, a sessão está "carregando" e a interface não mostra dados de ninguém.
- **Login e cadastro:** um diálogo só, aberto por parâmetro de URL (`?auth=entrar` ou `?auth=criar-conta`), válido em qualquer rota. Por estar na URL, sobrevive a refresh e fecha com o botão voltar. No mobile ocupa a tela inteira, como nos frames. O código do diálogo é baixado sob demanda.
- **Rotas privadas:** usam `requireSession` no `beforeLoad`. Sem sessão, levam à página inicial com o login aberto e `redirect` apontando para o destino. Só caminhos internos são aceitos em `redirect`.
- **Depois de entrar:** quem decide para onde ir é o layout raiz, em um único lugar: com sessão e pedido de login na URL, segue para `redirect` ou só limpa os parâmetros, ficando na mesma página.
- **Expiração:** quando a API responde 401 a uma chamada que levou token, `src/app/session.ts` encerra a sessão local e reabre o login com o aviso de sessão expirada. Em rota privada, o endereço atual vira o `redirect`, e o usuário volta para a mesma tela ao entrar de novo. Em página pública, ele nem sai do lugar.
- **Logout e troca de usuário:** `endSession` apaga o token, gera um `guestId` novo e descarta do cache tudo o que não é catálogo público. A conexão de socket é refeita com a identidade nova (ver "Tempo real").
- **Outra aba:** login ou logout feito em outra aba é percebido pelo evento `storage`, e esta aba também descarta o cache privado.

### Isolamento entre usuários

- Toda consulta de dado privado tem chave `['private', <id do usuário>, ...]` (`src/shared/lib/query-keys.ts`) e só é feita depois de a sessão dizer de quem é.
- A sessão em cache é guardada por token, então um token nunca reaproveita o usuário de outro.
- Ao abrir ou encerrar uma sessão, o cache privado e o de mutations são descartados antes.
- O catálogo é o único dado mantido na troca de sessão, por ser público. Ele não é apagado porque as telas abertas continuam observando essas consultas, e apagá-las as deixaria sem receber as atualizações em tempo real.

**Limitação:** o token trafega em header e o cliente o guarda no `localStorage`. Em produção o adequado seria um cookie `HttpOnly`, que um service worker de mock não consegue emitir.

## Favoritos

- Só existem para quem tem sessão. O estado vem de `GET /favorites`, com a chave privada do usuário.
- **Atualização otimista:** favoritar ou desfavoritar muda a tela na hora. Antes, a consulta em andamento é cancelada e o estado anterior é guardado. Se a API falhar, o estado anterior volta e o usuário é avisado; ao final, com sucesso ou erro, a lista é revalidada pela API.
- **Visitante:** o clique abre o login e deixa o pedido na URL (`?favoritar=<id>`). Com a sessão aberta, o pedido é executado uma vez e o parâmetro sai da URL. Fechar o login sem entrar descarta o pedido.

## Carrinho

- O carrinho é sempre um recurso REST, também para o visitante. O cliente gera um `guestId`, guarda no `localStorage` e o envia em `X-Guest-Id`; o mock guarda os carrinhos por dono (`guest:<id>` ou `user:<id>`).
- No login e no cadastro, o mock passa os itens do visitante para o carrinho do usuário, somando quantidades do mesmo NFT e edição até o limite disponível, e apaga o carrinho do visitante.
- O item é o par NFT + edição. Cada edição tem preço, estoque e limite por pedido próprios.
- Cada item informa `available`, `maxQuantity` e `status`. Se o estoque cair abaixo da quantidade no carrinho, o item fica `insufficient-stock` e a cotação é recusada até o ajuste.

### No cliente

- **Uma consulta, dois lugares:** o contador do cabeçalho (e da barra do mobile) e a página do carrinho leem a mesma consulta em cache, com chave privada do dono (`useCart`). O dono é o usuário da sessão ou `guest:<id>`; enquanto a sessão está sendo confirmada, nenhum carrinho é consultado.
- **Sem atualização otimista:** adicionar, alterar e remover esperam a resposta da API, que devolve o carrinho inteiro, e é essa resposta que vai para o cache. Os controles do item ficam desabilitados enquanto isso. Limites de estoque são validados pela API; a recusa aparece como aviso.
- **Valores só da cotação:** subtotal, desconto, taxa de rede e total vêm de `POST /quotes`. A cotação é uma consulta cuja chave inclui o conteúdo do carrinho (itens, quantidades e versão de cada NFT) e o cupom; qualquer mudança pede outra.
- **Cupom na URL** (`/carrinho?cupom=KURIO10`): sobrevive a refresh e segue para o pagamento. Aplicar um cupom é pedir a cotação com ele; se a API recusa, a mensagem vai para o campo e o resumo continua sem desconto. Um cupom inválido que chegue pela URL é sinalizado, com a opção de removê-lo.
- **Mudanças em tempo real:** `nft.updated` revalida carrinho e cotação. A página compara o carrinho novo com o anterior e avisa, na linha do item e na região `aria-live`, quando o preço mudou ou o estoque ficou abaixo da quantidade. Mudanças feitas pelo próprio usuário não geram aviso.
- **Estoque insuficiente:** o item mostra quanto ainda é possível levar e oferece o ajuste; o resumo troca os valores por um pedido de ajuste até a cotação voltar a ser possível.
- **Login e logout:** ao entrar, o mock mescla o carrinho do visitante no da conta e o cache privado é descartado, então a tela recarrega já o carrinho mesclado. Ao sair, a identidade de visitante é trocada antes de as telas reagirem, e o carrinho aparece vazio.

## Cotação e pedidos

- `POST /quotes` calcula subtotal, desconto do cupom, taxa de rede (uma por rede envolvida) e total a partir dos preços e estoques do momento. O campo `version` é uma impressão digital desses valores.
- `POST /orders` recebe a `quoteVersion` que o usuário confirmou. O mock recalcula a cotação; se a versão for outra (preço, estoque, cupom ou taxa mudaram), responde 409 `QUOTE_STALE` com a cotação atual, e a compra só segue com nova confirmação.
- **Idempotência:** a chave vem no header `Idempotency-Key`. Mesma chave e mesmo corpo devolvem o pedido já criado (200 em vez de 201); mesma chave com corpo diferente responde 409.
- **Estados:** o pedido nasce `pending` e a simulação o resolve 3 segundos depois como `confirmed` ou `declined`. Os dois últimos são terminais. A resolução depende só do horário gravado no pedido, então sobrevive a refresh e nunca acontece duas vezes (detalhes em "Tempo real").
- **Confirmação:** baixa o estoque e remove do carrinho só os itens e quantidades comprados. Na recusa o carrinho fica intacto.
- **Recibo:** é uma cópia dos itens, valores, cupom e carteira no momento da compra. Mudanças posteriores no catálogo não o alteram.
- A carteira escolhida precisa estar cadastrada e conectada. O hash da transação e o link do explorador são simulados.

### No cliente

O pagamento (`/pagamento`) e o pedido (`/pedido/<id>`) são rotas privadas.

- **Três passos visíveis:** escolher e, se preciso, salvar a carteira; conectá-la; confirmar a compra. O botão de confirmar fica desabilitado enquanto algo impede, e o motivo aparece escrito junto dele.
- **Carteira:** o usuário escolhe entre a principal e a secundária. O formulário é o do contrato de carteiras, o mesmo da tela de Carteiras. A conexão é simulada: conectar pode ser recusado pela carteira, e desconectar bloqueia a compra de novo.
- **Revisão:** itens e valores vêm da cotação. A tela guarda a versão da cotação que o usuário viu. Se chegar outra (preço, estoque ou taxa mudaram, por evento em tempo real ou por nova consulta), aparece o total antigo e o novo, e a compra só pode ser confirmada depois de o usuário declarar que revisou.
- **Envio:** o pedido leva a versão revisada. Se a API responder `QUOTE_STALE` ou `INSUFFICIENT_STOCK`, a tela busca carrinho e cotação atuais, o que leva à mesma revisão.
- **Idempotência** (`src/features/orders/attempt.ts`): a chave é gerada uma vez por tentativa e guardada no navegador, sob o id do usuário. Enquanto o conteúdo do pedido for o mesmo, a chave é a mesma: clique repetido, nova tentativa depois de um timeout e refresh no meio recuperam o pedido já criado. Mudou o conteúdo, é outra tentativa. A chave é descartada quando o pedido chega a um estado final e quando a sessão muda.
- **Falha transitória no envio:** a tela não sabe se o pedido foi criado e diz isso; tentar de novo usa a mesma chave. Mutations não são repetidas automaticamente.
- **Pedido pendente:** a tela do pedido espera o evento `order.updated`. Só se o socket estiver fora do ar ela consulta a API, a cada 2 segundos, até a conexão voltar ou o pedido chegar a um estado final. Por estar na URL, o pedido sobrevive a refresh.
- **Confirmação:** o recibo só é renderizado para pedido com estado `confirmed` vindo da simulação (pelo evento ou pela API), e mostra o snapshot guardado no pedido. Ao chegar a um estado final, o carrinho é consultado de novo.
- **Recusa:** mostra o motivo; o carrinho fica intacto e dá para tentar de novo, o que cria outro pedido.
- **Sessão expirada no meio:** o login reabre e devolve o usuário ao pagamento. Carrinho e carteira estão no servidor e o cupom está na URL, então nada se perde.

## Perfil e carteiras

- **Dados do perfil:** o formulário usa o mesmo schema que a API valida (`profileInputSchema`). Erros de regra aparecem antes do envio; conflito de e-mail ou de nome de usuário volta da API por campo e o primeiro campo com erro recebe o foco. A resposta vai para o cache do perfil, e a sessão é consultada de novo para o cabeçalho mostrar o nome novo.
- **Avatar:** a imagem escolhida é recortada em um quadrado de 256 px e convertida para JPEG no navegador (`src/features/profile/avatar-image.ts`) antes de ir à API como data URL, o que a mantém dentro do limite de 220 KB do contrato. Arquivo que não é PNG, JPEG ou WebP é recusado na tela. Troca e remoção são gravadas na hora, sem depender do botão "Salvar".
- **Senha:** formulário próprio. A API confere a senha atual; se a troca der certo, a sessão atual continua e as outras sessões da conta são encerradas. A senha só existe no mock como hash com salt.
- **Carteiras:** principal e secundária usam o mesmo formulário e o mesmo contrato do pagamento. Uma carteira salva aparece como resumo (apelido, rede, endereço abreviado, tipo e conexão) e abre para edição. "Igual à carteira principal" preenche o cadastro da secundária com os dados da principal, que podem ser ajustados antes de salvar. Trocar o endereço ou o tipo de uma carteira a desconecta, e o pagamento pede a conexão de novo.
- Tudo é gravado no banco simulado e permanece após refresh. As consultas levam o id do usuário na chave e são descartadas na troca de sessão.

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

- O cliente é o `socket.io-client`, aberto em `src/app/socket.ts`, na mesma origem da aplicação e com o caminho `/realtime/`. `src/app/realtime.tsx` mantém a conexão enquanto a aplicação está aberta e liga os eventos ao cache. A conexão pertence à sessão: quando o token muda (login, logout, expiração), a conexão anterior é fechada com seus listeners e outra é aberta com a identidade nova. Um evento endereçado ao usuário anterior não tem como chegar a quem entrou depois.
- O servidor é simulado em `src/mocks/socket/server.ts` com o `ws` do MSW e o `@mswjs/socket.io-binding`, que codifica e decodifica os pacotes do protocolo Socket.IO.
- A autenticação usa o campo `auth` do Socket.IO: o cliente envia o token da sessão no pacote de conexão e o mock associa a conexão ao usuário.

### REST e eventos contam a mesma história

Toda mudança de versão de NFT ou de pedido passa por `src/mocks/db/changes.ts`. A mudança entra em uma fila e só vira evento depois que o banco é gravado, e o evento é montado a partir do estado gravado. Não há outro caminho para emitir evento.

Os testes e o `window.__mockControl` também seguem essa regra: alterar uma edição, derrubar conexões ou reenviar um evento acontece no servidor de socket do mock, e o que chega à interface chega pelo `socket.io-client`.

### No cliente

`src/app/realtime.tsx` é o único lugar que escuta os eventos.

- **Duplicatas e eventos antigos** (`src/features/realtime/event-guard.ts`): todo evento passa por um guarda antes de ter efeito. Ele descarta o evento cujo `id` já foi visto e o evento cuja `version` é menor ou igual à última aplicada àquele recurso, ou à versão que já está no cache. Um evento descartado não refaz consultas, não muda o cache e não gera aviso.
- **`nft.updated`:** o evento só avisa que o NFT mudou. Catálogo, carrinho e cotação são refeitos pela API REST, então a tela nunca mostra um valor montado a partir do evento.
- **`order.updated`:** o pedido do evento vai para o cache e o resultado é anunciado na região `aria-live`. Um pedido já confirmado ou recusado não é alterado por nenhum evento. O carrinho e o catálogo são revalidados, porque a confirmação baixa o estoque e tira do carrinho o que foi comprado.
- **Reconexão:** a cada conexão (a primeira e todas as seguintes) o cliente revalida pela API REST o catálogo, o carrinho, a cotação e os pedidos em uso. Enquanto o socket está fora do ar, a tela de um pedido pendente consulta a API periodicamente.
- **Ciclo de vida:** a conexão, os listeners e o guarda pertencem à sessão. Na troca de token tudo é descartado e recriado, e o evento de pedido só é aplicado ao usuário da sessão que abriu a conexão.

### Limitações da simulação

- **Só WebSocket.** O MSW intercepta WebSocket, mas não o long-polling com que o Socket.IO começa por padrão. Por isso o cliente usa `transports: ['websocket']`.
- **Cliente carregado depois do mock.** O `socket.io-client` guarda a referência ao `WebSocket` do navegador no momento em que seu módulo é carregado. Se isso acontecer antes de o MSW substituir o `WebSocket`, a conexão vai para o servidor real e o mock nunca a vê. Por isso o cliente é importado sob demanda, depois de `backendReady()`.
- **Caminho próprio.** O MSW remove o prefixo `/socket.io/` da URL antes de procurar o handler, o que faria a conexão se confundir com qualquer outro WebSocket da origem (o HMR do Vite, por exemplo). Com `/realtime/` o handler casa só com o socket da aplicação.
- **Sem salas nem broadcast.** O binding não implementa esses recursos. O mock guarda as conexões abertas e escolhe o destino de cada evento.
- **Heartbeat manual.** O binding responde ao handshake, mas não envia os pings que o cliente espera do servidor. O mock envia um ping a cada 20 s; sem isso o cliente fecharia a conexão a cada 30 s.
- **Sem reentrega.** Um evento emitido enquanto o cliente estava desconectado se perde. Por isso, a cada conexão do socket (a primeira e todas as reconexões) o cliente revalida pela API REST as consultas de catálogo, carrinho, cotação e pedidos que estão em uso.
- **Recusa com erro.** Com o socket fora do ar (`setSocketAvailable(false)`), o mock dispara um erro no WebSocket antes de fechá-lo, como acontece com um servidor inacessível. Um fechamento limpo no meio do handshake deixaria o cliente Socket.IO parado até o tempo limite de conexão (20 s) antes de tentar de novo.
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

### Desvios do Figma e decisões de UX

- O estilo de cor *Secondary* do Figma (`#B39463`) chama-se `brand-secondary` no código, porque `secondary` já é um papel do shadcn/ui.
- **Contagens dos filtros:** o layout mostra números ilustrativos (33, 12, 65…). A aplicação mostra a contagem real de cada coleção e rede.
- **Linha de resultado:** acima da grade há a linha "36 NFTs encontrados", que não está no layout. Ela dá retorno, inclusive a leitores de tela, sobre o efeito de cada filtro.
- **Filtro selecionado:** além da cor, o item marcado ganha negrito e um ícone de confirmação, para o estado não depender só de cor.
- **Indicadores do carrossel:** têm área de toque de 24 px, maior que os pontos de 8 px do layout, para atender ao tamanho mínimo de alvo.
- **Itens fora do escopo do enunciado:** "Criadores" e "Aprenda" aparecem no menu, desabilitados e anunciados como "em breve". Os artigos do Diário da Cunhagem trazem "Artigo disponível em breve" no lugar do link "Ler mais". O formulário de novidades avisa que a inscrição não está disponível, em vez de simular sucesso. No rodapé, só as coleções são links; o restante é texto.
- **Mobile:** o frame mobile da página inicial mostra só a primeira tela. O restante da página, e a faixa de 768 px, seguem o desktop reorganizado em menos colunas.
- **Tela de carregamento:** o `index.html` traz a marca e "Carregando o marketplace…", exibidos até a aplicação iniciar. Não está no layout.
- **Cards no mobile:** o nome reserva duas linhas, para a grade ter a mesma altura com skeletons e com dados.
- **Ações no card:** o coração fica sempre visível no canto do card e, em telas largas, o botão de carrinho logo abaixo (adiciona uma unidade da edição padrão). No layout desktop eles aparecem ao passar o mouse, junto de um zoom, o que os esconderia de quem usa teclado ou toque. O zoom ficou de fora.
- **Detalhe do NFT:**
  - O preço exibido é o da edição selecionada, e a edição escolhida vai para a URL (`?edicao=`).
  - Edição esgotada aparece riscada e desabilitada. A quantidade é limitada pelo estoque e pelo limite por pedido, com a explicação logo abaixo.
  - No layout, os rótulos "Contrato" e "Direitos autorais" estão trocados em relação aos textos. A aplicação os mostra na ordem coerente.
  - A aba de avaliações mostra a nota e a contagem, que é o que a API tem; não há lista de comentários.
  - O ícone de zoom da galeria e "Compartilhar este NFT" ficaram de fora, por serem ações fora do escopo.
  - No mobile há miniaturas abaixo da imagem, que o frame não mostra, para a galeria funcionar.
  - No mobile, "Comprar NFT" e o botão de carrinho ficam no fim das opções de compra, no fluxo da página. No frame eles ficam em uma barra fixa, que disputaria o lugar com a navegação inferior.
- **Login e cadastro:** "Continuar com Google", "Continuar com Facebook" e "Esqueceu a senha?" aparecem como no layout e respondem com um aviso de indisponível.
- **Com sessão:** o botão "Entrar" do cabeçalho dá lugar ao primeiro nome do usuário, que leva ao perfil, e a um botão de sair. O layout não desenha esse estado.
- **Navegação inferior do mobile:** Início, Favoritos, o botão central (leva ao catálogo), Carrinho e Perfil, como no frame. O item em destaque é o da seção aberta; com o login aberto, o destaque vai para a conta. Telas que não pertencem a nenhuma seção (detalhe, pedido) não destacam nenhum item.
- **Tela de favoritos** (`/favoritos`): não está no layout. Existe para o coração da barra ter destino; no desktop, chega-se a ela por "Lista de interesse", na navegação do perfil. Usa os cards do catálogo, e desfavoritar tira o card da tela na hora.
- **Perfil e carteiras:**
  - O layout tem um único botão "Salvar" para os dados e a senha. A aplicação tem dois formulários, cada um com seu botão, para que um erro na senha não se confunda com o salvamento dos dados.
  - O campo "Nome ENS" é um campo de texto com a indicação "sem o .eth"; o layout mostra um seletor de sufixo com uma única opção.
  - "Atividade", "Ofertas", "Arquivos baixados" e "Suporte" aparecem na navegação lateral, desabilitados e anunciados como "em breve". "Lista de interesse" leva à tela de favoritos.
  - Sem frame mobile: a navegação lateral vira uma faixa com "Dados do perfil", "Carteiras" e "Sair", e os formulários passam a uma coluna.
  - Na tela de carteiras, a carteira salva aparece como resumo com "Editar"; o layout só desenha o formulário aberto.
- **Carrinho:**
  - "Comprar" adiciona a seleção e leva ao carrinho; o botão de carrinho adiciona e fica na página.
  - Cada linha mostra também a edição, que o frame desktop não mostra, porque o mesmo NFT pode estar no carrinho em edições diferentes.
  - O desconto aparece como "(-) 0.00 ETH", no mesmo formato dos outros valores; o frame mostra "(-) 00.00".
  - Com um cupom aplicado, a linha de desconto leva a descrição do cupom e aparece a opção de removê-lo.
  - "Conectar e finalizar" leva ao pagamento; a conexão da carteira acontece lá.
- **Pagamento:**
  - O formulário do frame mistura dados de perfil e de carteira. A aplicação usa os campos do contrato de carteira (os mesmos da tela de Carteiras): o que o frame chama de "Nome de usuário" aqui é "Apelido da carteira", e o sufixo do ENS é fixo em `.eth`.
  - "Usar outra carteira?" virou a escolha explícita entre carteira principal e secundária, como no frame mobile.
  - As opções de "Carteira e rede" do frame (MetaMask, WalletConnect, Coinbase) repetiam o campo "Tipo de carteira" do formulário. Ficou um campo só, no formulário; o bloco "Carteira e rede" mostra a carteira escolhida, o estado da conexão e o botão de conectar ou desconectar.
  - No mobile, os dados de uma carteira já cadastrada ficam recolhidos atrás de "Editar".
  - "Tem um código promocional?" leva ao carrinho, onde o cupom é aplicado.
- **Confirmação do pedido:** é uma página (`/pedido/<id>`), não um diálogo sobre a tela anterior, para sobreviver a refresh e poder ser retomada. O recibo mostra também o subtotal e, se houver, o desconto. O link para o explorador vem com o aviso de que a transação é simulada.
- **Pedido pendente e recusado:** não estão no layout; seguem o padrão visual do recibo.
- **Avisos:** resultados de ações (como favoritar) e falhas aparecem em um aviso no rodapé da tela, que é também a região `aria-live` da aplicação.

## Testes

- Chromium em dois projetos: `desktop` (1440×900) e `mobile` (390×844, com toque).
- A suíte roda contra o build de produção servido por `vite preview`, o mesmo artefato que é publicado.
- Traces são guardados nas falhas e o relatório HTML é gerado em toda execução.
- Cada teste começa em um contexto de navegador novo, então o banco simulado parte sempre da semente.
- **Testes de interface** (`tests/e2e/*.spec.ts`) rodam nos dois projetos e verificam o que aparece na tela.
- **Testes de contrato** (`tests/e2e/api/`) rodam só no projeto desktop. Chamam a API com `fetch` de dentro da página, para passar pelo service worker do MSW, e abrem uma rota sem tela para que as consultas da própria aplicação não se misturem às do teste.
- **Tempo real:** os testes abrem conexões com o `socket.io-client` real dentro da página e disparam mudanças pelo `window.__mockControl`, que age no servidor de socket do mock.
- **Regressão visual** (`tests/e2e/visual.spec.ts`): página inicial, detalhe, carrinho e pagamento, com tolerância de 0,05% dos pixels. As imagens de referência ficam versionadas ao lado do teste e foram geradas no Windows. Em outro sistema a renderização de fonte difere; regenere com `npm run test:e2e -- visual --update-snapshots`.

## Lighthouse

`npm run lighthouse` faz o build, sobe o `vite preview` em uma porta própria e audita cada página em dois perfis (mobile e desktop), três vezes cada, com um Chrome novo por execução. O script grava os relatórios HTML e JSON de cada execução e um resumo com as medianas, LCP, CLS, TBT, versões e ambiente em `lighthouse/reports/`.

A configuração versionada está em `lighthouse/config.mjs`.

### O que foi feito pelo desempenho

O mock roda no navegador, então o JavaScript dele faz parte do carregamento de toda página. As medidas abaixo tratam disso sem tirar nada da entrega:

- **Carregamento em paralelo.** O ponto de entrada dispara a aplicação e o mock ao mesmo tempo, e um plugin em `vite.config.ts` anuncia esses chunks no HTML com `modulepreload`, para o download começar junto com o HTML.
- **Primeira pintura sem JavaScript.** O `index.html` traz uma tela de carregamento, e os `modulepreload` têm prioridade baixa para não disputar banda com o CSS e a fonte.
- **Biblioteca de cookies do MSW removida** do bundle, como descrito em "API simulada".
- **Socket sob demanda.** O `socket.io-client` fica fora do bundle inicial.
- **Imagens.** WebP em três larguras com `srcset` e `sizes`, dimensões declaradas, carregamento sob demanda abaixo da dobra e prioridade alta só para a arte do topo e a primeira linha de cards.
- **Fonte** servida da própria origem, com `preload` e `font-display: swap`.
- **Divisão de código por rota**, feita pelo plugin do router.
- **Sem deslocamento de layout.** Skeletons têm as dimensões do conteúdo final (CLS 0). O skeleton do detalhe ocupa a altura da tela, para o rodapé não aparecer e depois ser empurrado.
- **Bibliotecas e código comum agrupados** em dois arquivos (`vendor` e `common`), em vez de muitos chunks pequenos, cada um com sua ida ao servidor.
- **Filtros sob demanda.** O slider e o painel lateral não fazem parte da primeira pintura: são baixados à parte, com um lugar reservado do mesmo tamanho.
- **Seções abaixo da dobra adiadas** com `content-visibility: auto` (banners e Diário da Cunhagem): o navegador só as monta, e baixa suas imagens, quando o usuário se aproxima.
- **Atributo `loading` antes de `src`.** O React aplica os atributos na ordem em que aparecem, e o navegador começa o download ao receber `src`; com `loading="lazy"` depois, a imagem era baixada na hora.
