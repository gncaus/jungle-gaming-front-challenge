import desktopConfig from 'lighthouse/core/config/desktop-config.js'

/** Porta própria para não colidir com o `npm run preview` (4173). */
export const port = 4174

export const runsPerTarget = 3

/** Páginas auditadas. */
export const pages = [
  { name: 'inicio', path: '/' },
  { name: 'detalhe', path: '/nft/emerald-ape-042' },
]

/** `undefined` usa o perfil padrão do Lighthouse (mobile, com throttling simulado). */
export const profiles = [
  { name: 'mobile', config: undefined },
  { name: 'desktop', config: desktopConfig },
]

export const targets = {
  performance: 90,
  accessibility: 95,
  'best-practices': 95,
  seo: 90,
}

export const metrics = {
  LCP: 'largest-contentful-paint',
  CLS: 'cumulative-layout-shift',
  TBT: 'total-blocking-time',
}
