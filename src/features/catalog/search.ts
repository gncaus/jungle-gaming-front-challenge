import { z } from 'zod'
import {
  defaultPageSize,
  networkSchema,
  nftSorts,
  nftTabs,
  type NftListQuery,
} from '@/features/catalog/schemas'
import { ethAmountSchema } from '@/shared/lib/money'

/** O router lê `?q=123` e `?minPrice=0.5` como número; aqui voltam a ser texto. */
const textParam = z.union([z.string(), z.number()]).transform(String)

export const catalogSearchDefaults = {
  q: '',
  collection: [] as string[],
  network: [] as z.infer<typeof networkSchema>[],
  tab: 'all',
  sort: 'recent',
  page: 1,
} as const

/**
 * Estado do catálogo na URL. Valor inválido digitado na URL cai no padrão do campo,
 * em vez de quebrar a página.
 */
export const catalogSearchSchema = z.object({
  q: textParam.pipe(z.string().trim().max(80)).default(catalogSearchDefaults.q).catch(catalogSearchDefaults.q),
  collection: z.array(z.string()).default([]).catch([]),
  network: z.array(networkSchema).default([]).catch([]),
  minPrice: textParam.pipe(ethAmountSchema).optional().catch(undefined),
  maxPrice: textParam.pipe(ethAmountSchema).optional().catch(undefined),
  tab: z.enum(nftTabs).default(catalogSearchDefaults.tab).catch(catalogSearchDefaults.tab),
  sort: z.enum(nftSorts).default(catalogSearchDefaults.sort).catch(catalogSearchDefaults.sort),
  page: z.number().int().min(1).default(catalogSearchDefaults.page).catch(catalogSearchDefaults.page),
})

export type CatalogSearch = z.output<typeof catalogSearchSchema>

/** Filtros: tudo o que, ao mudar, deve voltar a paginação para a primeira página. */
export type CatalogFilters = Omit<CatalogSearch, 'page'>

export function toListQuery(search: CatalogSearch): NftListQuery {
  return { ...search, pageSize: defaultPageSize }
}

export function countActiveFilters(search: CatalogSearch): number {
  return (
    search.collection.length +
    search.network.length +
    (search.minPrice || search.maxPrice ? 1 : 0)
  )
}
