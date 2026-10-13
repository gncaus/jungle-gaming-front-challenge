import { z } from 'zod'
import { ethAmountSchema } from '@/shared/lib/money'

export const networkIds = ['ethereum', 'polygon', 'solana'] as const
export const networkSchema = z.enum(networkIds)
export type NetworkId = z.infer<typeof networkSchema>

export const nftImageSchema = z.object({
  alt: z.string(),
  /** Variantes da mesma imagem, da menor para a maior, para montar o `srcset`. */
  sources: z.array(z.object({ url: z.string(), width: z.number().int().positive() })).min(1),
})
export type NftImage = z.infer<typeof nftImageSchema>

export const nftSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  tokenId: z.string(),
  image: nftImageSchema,
  collection: z.object({ id: z.string(), name: z.string() }),
  network: networkSchema,
  /** Preço da edição padrão. */
  price: ethAmountSchema,
  previousPrice: ethAmountSchema.nullable(),
  rarity: z.enum(['common', 'rare']),
  isNew: z.boolean(),
  isTrending: z.boolean(),
  soldOut: z.boolean(),
  defaultEditionId: z.string(),
  /** Cresce a cada mudança de preço ou disponibilidade; base da ordenação dos eventos. */
  version: z.number().int().nonnegative(),
  listedAt: z.iso.datetime(),
})
export type NftSummary = z.infer<typeof nftSummarySchema>

export const nftEditionSchema = z.object({
  id: z.string(),
  label: z.string(),
  price: ethAmountSchema,
  available: z.number().int().nonnegative(),
  maxPerOrder: z.number().int().positive(),
})
export type NftEdition = z.infer<typeof nftEditionSchema>

export const nftDetailSchema = nftSummarySchema.extend({
  description: z.string(),
  story: z.array(z.string()),
  gallery: z.array(nftImageSchema).min(1),
  editions: z.array(nftEditionSchema).min(1),
  attributes: z.array(z.string()),
  rating: z.object({ average: z.number().min(0).max(5), count: z.number().int().nonnegative() }),
  creator: z.object({ name: z.string(), royaltyPercent: z.number().int().nonnegative() }),
  contract: z.object({ address: z.string(), standard: z.string() }),
})
export type NftDetail = z.infer<typeof nftDetailSchema>

export const nftTabs = ['all', 'new', 'trending'] as const
export const nftSorts = ['recent', 'price-asc', 'price-desc', 'name'] as const

export const defaultPageSize = 9

/** Parâmetros de `GET /nfts`. Listas trafegam como parâmetro repetido (`collection=a&collection=b`). */
export const nftListQuerySchema = z.object({
  q: z.string().trim().max(80).default(''),
  collection: z.array(z.string()).default([]),
  network: z.array(networkSchema).default([]),
  minPrice: ethAmountSchema.optional(),
  maxPrice: ethAmountSchema.optional(),
  tab: z.enum(nftTabs).default('all'),
  sort: z.enum(nftSorts).default('recent'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(24).default(defaultPageSize),
})
export type NftListQuery = z.infer<typeof nftListQuerySchema>

export const nftListResponseSchema = z.object({
  items: z.array(nftSummarySchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
})
export type NftListResponse = z.infer<typeof nftListResponseSchema>

const facetOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  count: z.number().int().nonnegative(),
})

export const nftFacetsSchema = z.object({
  collections: z.array(facetOptionSchema),
  networks: z.array(facetOptionSchema.extend({ id: networkSchema })),
  price: z.object({ min: ethAmountSchema, max: ethAmountSchema }),
})
export type NftFacets = z.infer<typeof nftFacetsSchema>
