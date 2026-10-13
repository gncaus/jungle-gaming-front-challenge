import {
  nftDetailSchema,
  nftFacetsSchema,
  nftHighlightsSchema,
  nftListResponseSchema,
  type NftDetail,
  type NftFacets,
  type NftHighlights,
  type NftListQuery,
  type NftListResponse,
} from '@/features/catalog/schemas'
import { http } from '@/shared/lib/http'

export async function fetchNfts(query: NftListQuery, signal?: AbortSignal): Promise<NftListResponse> {
  const { q, ...rest } = query
  const { data } = await http.get<unknown>('/nfts', {
    params: { ...rest, q: q || undefined },
    signal,
  })
  return nftListResponseSchema.parse(data)
}

export async function fetchNftFacets(signal?: AbortSignal): Promise<NftFacets> {
  const { data } = await http.get<unknown>('/nfts/facets', { signal })
  return nftFacetsSchema.parse(data)
}

export async function fetchNftHighlights(signal?: AbortSignal): Promise<NftHighlights> {
  const { data } = await http.get<unknown>('/nfts/highlights', { signal })
  return nftHighlightsSchema.parse(data)
}

export async function fetchNft(nftId: string, signal?: AbortSignal): Promise<NftDetail> {
  const { data } = await http.get<unknown>(`/nfts/${encodeURIComponent(nftId)}`, { signal })
  return nftDetailSchema.parse(data)
}
