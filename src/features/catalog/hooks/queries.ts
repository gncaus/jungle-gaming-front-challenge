import { queryOptions } from '@tanstack/react-query'
import {
  fetchNft,
  fetchNftFacets,
  fetchNftHighlights,
  fetchNfts,
} from '@/features/catalog/api/catalog-api'
import type { NftListQuery } from '@/features/catalog/schemas'

/** Dados públicos: as chaves não levam usuário. Os parâmetros da consulta fazem parte da chave. */
export const catalogKeys = {
  all: ['catalog'] as const,
  lists: () => [...catalogKeys.all, 'list'] as const,
  list: (query: NftListQuery) => [...catalogKeys.lists(), query] as const,
  facets: () => [...catalogKeys.all, 'facets'] as const,
  highlights: () => [...catalogKeys.all, 'highlights'] as const,
  detail: (nftId: string) => [...catalogKeys.all, 'detail', nftId] as const,
}

/**
 * Cada combinação de parâmetros tem sua chave, e o `signal` cancela a requisição quando
 * a chave deixa de ser observada. Uma resposta atrasada de filtros antigos nunca é exibida.
 */
export function nftListQueryOptions(query: NftListQuery) {
  return queryOptions({
    queryKey: catalogKeys.list(query),
    queryFn: ({ signal }) => fetchNfts(query, signal),
  })
}

export const nftFacetsQueryOptions = queryOptions({
  queryKey: catalogKeys.facets(),
  queryFn: ({ signal }) => fetchNftFacets(signal),
})

export const nftHighlightsQueryOptions = queryOptions({
  queryKey: catalogKeys.highlights(),
  queryFn: ({ signal }) => fetchNftHighlights(signal),
})

export function nftDetailQueryOptions(nftId: string) {
  return queryOptions({
    queryKey: catalogKeys.detail(nftId),
    queryFn: ({ signal }) => fetchNft(nftId, signal),
  })
}
