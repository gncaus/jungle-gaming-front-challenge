import { mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'
import { preview } from 'vite'
import { metrics, pages, port, profiles, runsPerTarget, targets } from './config.mjs'

const reportsDir = fileURLToPath(new URL('./reports/', import.meta.url))

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

async function auditOnce(url, config) {
  // Um Chrome novo por execução garante perfil limpo (sem cache nem service worker anterior).
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new'] })
  try {
    const result = await lighthouse(
      url,
      { port: chrome.port, output: ['html', 'json'], logLevel: 'error' },
      config,
    )
    if (!result) {
      throw new Error(`O Lighthouse não retornou resultado para ${url}`)
    }
    return result
  } finally {
    await chrome.kill()
  }
}

function formatMetric(name, value) {
  return name === 'CLS' ? value.toFixed(3) : `${Math.round(value)} ms`
}

await rm(reportsDir, { recursive: true, force: true })
await mkdir(reportsDir, { recursive: true })

const server = await preview({ preview: { port, strictPort: true } })
const rows = []
let environment

try {
  for (const page of pages) {
    for (const profile of profiles) {
      const runs = []
      for (let run = 1; run <= runsPerTarget; run += 1) {
        const { lhr, report } = await auditOnce(`http://localhost:${port}${page.path}`, profile.config)
        const [html, json] = report
        const base = `${reportsDir}${page.name}-${profile.name}-${run}`
        await writeFile(`${base}.html`, html)
        await writeFile(`${base}.json`, json)
        runs.push(lhr)
        environment ??= {
          lighthouse: lhr.lighthouseVersion,
          userAgent: lhr.environment.hostUserAgent,
          benchmarkIndex: lhr.environment.benchmarkIndex,
        }
        process.stdout.write(`${page.name} / ${profile.name} / execução ${run} concluída\n`)
      }

      const scores = Object.fromEntries(
        Object.keys(targets).map((category) => [
          category,
          median(runs.map((lhr) => Math.round((lhr.categories[category]?.score ?? 0) * 100))),
        ]),
      )
      const measured = Object.fromEntries(
        Object.entries(metrics).map(([name, audit]) => [
          name,
          median(runs.map((lhr) => lhr.audits[audit]?.numericValue ?? 0)),
        ]),
      )
      rows.push({ page: page.name, profile: profile.name, scores, metrics: measured })
    }
  }
} finally {
  await server.close()
}

const summary = {
  generatedAt: new Date().toISOString(),
  runsPerTarget,
  targets,
  environment: {
    ...environment,
    node: process.version,
    os: `${os.type()} ${os.release()} (${os.arch()})`,
    cpu: os.cpus()[0]?.model,
    server: `vite preview (build de produção) em http://localhost:${port}`,
  },
  results: rows,
}
await writeFile(`${reportsDir}summary.json`, `${JSON.stringify(summary, null, 2)}\n`)

const categories = Object.keys(targets)
const header = ['Página', 'Perfil', ...categories, ...Object.keys(metrics)]
const lines = [
  `| ${header.join(' | ')} |`,
  `| ${header.map(() => '---').join(' | ')} |`,
  ...rows.map((row) => {
    const scoreCells = categories.map((category) => {
      const score = row.scores[category]
      return score >= targets[category] ? `${score}` : `${score} (abaixo de ${targets[category]})`
    })
    const metricCells = Object.keys(metrics).map((name) => formatMetric(name, row.metrics[name]))
    return `| ${[row.page, row.profile, ...scoreCells, ...metricCells].join(' | ')} |`
  }),
]
const markdown = [
  '# Lighthouse — medianas',
  '',
  `Gerado em ${summary.generatedAt}, ${runsPerTarget} execuções por página e perfil.`,
  '',
  ...lines,
  '',
  '## Ambiente',
  '',
  ...Object.entries(summary.environment).map(([key, value]) => `- ${key}: ${value}`),
  '',
].join('\n')
await writeFile(`${reportsDir}summary.md`, markdown)
process.stdout.write(`\n${lines.join('\n')}\n\nRelatórios em lighthouse/reports/\n`)
