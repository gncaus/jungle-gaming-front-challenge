# Kurio — Marketplace de NFTs

Solução do desafio frontend descrito em [DESAFIO.md](DESAFIO.md). A aplicação roda inteira contra uma API simulada com MSW; não há backend real.

**Aplicação publicada:** https://jungle-gaming-front-challenge.vercel.app

Telas: início com catálogo, detalhe do NFT, carrinho, pagamento, confirmação do pedido, login e cadastro, perfil do colecionador, carteiras e favoritos.

## Requisitos

- Node.js 22 ou superior
- npm (o `package-lock.json` é a referência de versões)

## Como rodar

```bash
npm ci
npm run dev
```

A aplicação abre em `http://localhost:5173` já com a API simulada ligada.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com mocks |
| `npm run build` | Checagem de tipos e build de produção em `dist/` |
| `npm run preview` | Serve o build em `http://localhost:4173` |
| `npm run typecheck` | Checagem de tipos (TypeScript strict) |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Testes Playwright (Chromium, 1440 px e 390 px) contra o build |
| `npm run lighthouse` | Build + auditoria Lighthouse, com medianas em `lighthouse/reports/` |

Antes da primeira execução dos testes, instale o navegador do Playwright:

```bash
npx playwright install chromium
```

O relatório HTML dos testes fica em `playwright-report/` (`npx playwright show-report`) e os traces das falhas em `test-results/`.

A suíte inclui regressão visual, com imagens de referência geradas no Windows. Para regenerá-las depois de uma mudança visual intencional (ou em outro sistema operacional):

```bash
npm run test:e2e -- visual --update-snapshots
```

Para rodar a suíte contra um ambiente publicado, informe a URL:

```bash
PW_BASE_URL=https://jungle-gaming-front-challenge.vercel.app npm run test:e2e
```

## Variáveis de ambiente

| Variável | Padrão | Efeito |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | ligada | Defina `false` para desligar a API simulada |

Nenhuma variável é obrigatória. Há um modelo em [.env.example](.env.example).

## Credenciais fictícias

| Usuário | E-mail | Senha | Estado inicial |
| --- | --- | --- | --- |
| Ana Ribeiro | `ana@kurio.test` | `Kurio@123` | 2 favoritos e a carteira principal cadastrada |
| Bruno Tavares | `bruno@kurio.test` | `Kurio@456` | sem favoritos e sem carteiras |

Cupons: `KURIO10` (10%), `GENESIS25` (25%, para compras a partir de 5 ETH) e `VERAO2025` (expirado).

## Cenários da API simulada

Escolha um cenário acrescentando `?scenario=<nome>` a qualquer URL, por exemplo `http://localhost:5173/?scenario=slow`. A escolha fica gravada no navegador e continua valendo após refresh. Para voltar ao normal, use `?scenario=default`.

| Cenário | Efeito |
| --- | --- |
| `default` | Tudo funciona, com latência baixa |
| `empty-catalog` | O catálogo não tem nenhum NFT |
| `slow` | Toda resposta demora 2 segundos |
| `variable-latency` | Respostas entre 100 ms e 1,5 s, em sequência determinística |
| `out-of-order` | Consultas ao catálogo chegam fora de ordem |
| `offline` | Toda requisição falha por erro de conexão |
| `server-error` | Toda requisição responde 500 |
| `flaky` | As duas primeiras tentativas de cada rota respondem 503; a terceira funciona |
| `session-expired` | Toda requisição autenticada responde como sessão expirada |
| `favorites-failure` | Favoritar e desfavoritar falham após 0,6 s; as consultas funcionam |
| `price-changed` | O preço do primeiro item do carrinho sobe 10% ao confirmar a compra |
| `sold-out` | A edição do primeiro item esgota ao confirmar a compra |
| `order-timeout` | O pedido é criado, mas a conexão cai antes da resposta |
| `payment-declined` | O pagamento é recusado |
| `wallet-rejected` | A carteira recusa a conexão |

Conflito de cadastro e cupom inválido ou expirado não precisam de cenário: basta usar um e-mail já cadastrado ou os cupons acima.

### Reset

No console do navegador:

```js
window.__mockControl.reset()
```

Isso restaura o banco simulado e o cenário padrão. Recarregue a página em seguida.

O mesmo objeto permite trocar de cenário e provocar mudanças sem passar pela interface:

```js
window.__mockControl.setScenario('payment-declined')
window.__mockControl.expireSessions()
window.__mockControl.updateEdition({ nftId: 'emerald-ape-042', editionId: 'limited-50', price: '1.5' })
```

### Tempo real

`updateEdition` altera o banco simulado e o servidor de socket do mock emite o evento `nft.updated` correspondente. Para reproduzir falhas de conexão e de entrega:

```js
window.__mockControl.disconnectSockets()          // derruba as conexões; o cliente reconecta
window.__mockControl.setSocketAvailable(false)    // mantém o socket fora do ar
window.__mockControl.setSocketAvailable(true)     // volta a aceitar conexões
window.__mockControl.getEmittedEvents()           // eventos já emitidos nesta página
window.__mockControl.replayEvent('nft:emerald-ape-042:v2') // reenvia um evento (duplicata ou antigo)
window.__mockControl.connectedUsers()            // usuários das conexões de socket abertas
```

Um evento reenviado é descartado pelo cliente: nada é consultado de novo e nenhum aviso se repete. Com o socket fora do ar, a tela de um pedido pendente passa a consultar a API até a conexão voltar.

## Como reproduzir os fluxos de falha

Entre com uma das contas fictícias e use os cenários acima. Nas linhas do pagamento, chegue à tela com a carteira conectada e troque o cenário pelo console, com `window.__mockControl.setScenario('<nome>')`. Para voltar ao normal, `setScenario('default')` ou `?scenario=default`.

| Fluxo | Como reproduzir | O que esperar |
| --- | --- | --- |
| Carregamento lento | Abra `/?scenario=slow` | Skeletons com shimmer no catálogo, no detalhe e no carrinho |
| Falha ao carregar e nova tentativa | Abra `/?scenario=server-error`; depois rode `window.__mockControl.setScenario('default')` no console e clique em "Tentar novamente" | Mensagem de erro e recuperação sem recarregar |
| Falha transitória | Abra `/?scenario=flaky` | O catálogo carrega sozinho depois de duas tentativas |
| Favorito que falha | Com sessão, abra um NFT com `?scenario=favorites-failure` e favorite | O coração acende, volta ao estado anterior e um aviso explica a falha |
| Sessão expirada | Com sessão, rode `window.__mockControl.expireSessions()` e navegue | O login reabre e devolve você à mesma tela |
| Cupom inválido ou expirado | No carrinho, aplique `NADA` ou `VERAO2025` | Recusa com o motivo, sem alterar o total |
| Preço alterado na compra | No pagamento, rode `updateEdition` (exemplo acima) com um item do carrinho | A tela mostra o total antigo e o novo e exige nova confirmação |
| Edição esgotada na compra | No pagamento, `setScenario('sold-out')` e confirme | O pedido não é criado; a tela pede o ajuste das quantidades e o carrinho marca a edição como esgotada |
| Timeout após criar o pedido | No pagamento, `setScenario('order-timeout')` e confirme; depois confirme de novo | A tela avisa que não sabe se o pedido foi criado; a segunda tentativa recupera o mesmo pedido, sem compra duplicada |
| Pagamento recusado | No pagamento, `setScenario('payment-declined')` e confirme | Tela de recusa; o carrinho continua intacto |
| Carteira recusa a conexão | No pagamento, com a carteira desconectada, `setScenario('wallet-rejected')` e clique em "Conectar carteira" | Aviso de recusa; a compra continua bloqueada |
| Socket cai com pedido pendente | Confirme a compra e rode `window.__mockControl.setSocketAvailable(false)` em seguida | O pedido chega ao estado final pela API, sem nova compra |

## Imagens

Os originais exportados do Figma ficam em `src/assets/nfts/`. As variantes WebP servidas pela aplicação estão versionadas em `public/images/nfts/` e são geradas por:

```bash
node scripts/optimize-images.mjs
```

## Documentação

- [ARCHITECTURE.md](ARCHITECTURE.md): decisões técnicas, contratos e limitações.
- [docs/STATUS.md](docs/STATUS.md): o que está pronto e o que falta.
