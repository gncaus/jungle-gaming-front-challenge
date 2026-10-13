import {
  nftListQuerySchema,
  type NftDetail,
  type NftFacets,
  type NftListResponse,
} from '@/features/catalog/schemas'
import { readDb } from '@/mocks/db/store'
import { buildFacets, findNft, listNfts, toDetail } from '@/mocks/domain/catalog'
import { parseInput } from '@/mocks/handlers/http-error'
import { route } from '@/mocks/handlers/route'

export const nftHandlers = [
  route<NftListResponse>('get', '/nfts', ({ url }) => {
    const params = url.searchParams
    const query = parseInput(nftListQuerySchema, {
      q: params.get('q') ?? undefined,
      collection: params.getAll('collection'),
      network: params.getAll('network'),
      minPrice: params.get('minPrice') ?? undefined,
      maxPrice: params.get('maxPrice') ?? undefined,
      tab: params.get('tab') ?? undefined,
      sort: params.get('sort') ?? undefined,
      page: params.get('page') ?? undefined,
      pageSize: params.get('pageSize') ?? undefined,
    })
    return listNfts(readDb(), query)
  }),

  // Precisa vir antes de `/nfts/:id`, que também casaria com este caminho.
  route<NftFacets>('get', '/nfts/facets', () => buildFacets(readDb())),

  route<NftDetail>('get', '/nfts/:id', ({ param }) => toDetail(findNft(readDb(), param('id')))),
]
