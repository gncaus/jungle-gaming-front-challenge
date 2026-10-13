# Kurio — Marketplace de NFTs

Solução do desafio frontend descrito em [DESAFIO.md](DESAFIO.md). A aplicação roda inteira contra uma API simulada com MSW; não há backend real.

> Em construção. O estado atual de cada fluxo está em [docs/STATUS.md](docs/STATUS.md).

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

Para rodar a suíte contra um ambiente publicado, informe a URL:

```bash
PW_BASE_URL=https://exemplo.vercel.app npm run test:e2e
```

## Variáveis de ambiente

| Variável | Padrão | Efeito |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | ligada | Defina `false` para desligar a API simulada |

Nenhuma variável é obrigatória. Há um modelo em [.env.example](.env.example).

## Documentação

- [ARCHITECTURE.md](ARCHITECTURE.md): decisões técnicas, contratos e limitações.
- [docs/STATUS.md](docs/STATUS.md): o que está pronto e o que falta.
