import Decimal from 'decimal.js'
import {
  networkIds,
  type NftDetail,
  type NftFacets,
  type NftListQuery,
  type NftListResponse,
  type NftSummary,
} from '@/features/catalog/schemas'
import type { DbState, EditionRecord, NftRecord } from '@/mocks/db/types'
import { collectionName, collections, networks } from '@/mocks/fixtures/collections'
import { coverImage, galleryImages } from '@/mocks/fixtures/images'
import { MockApiError } from '@/mocks/handlers/http-error'
import { getScenario } from '@/mocks/scenarios/state'
import type { EthAmount } from '@/shared/lib/money'

function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

function visibleNfts(state: DbState): NftRecord[] {
  return getScenario().emptyCatalog ? [] : state.nfts
}

export function findNft(state: DbState, nftId: string): NftRecord {
  const nft = state.nfts.find((candidate) => candidate.id === nftId)
  if (!nft) {
    throw new MockApiError('NOT_FOUND', 'NFT não encontrado.')
  }
  return nft
}

export function findEdition(nft: NftRecord, editionId: string): EditionRecord {
  const edition = nft.editions.find((candidate) => candidate.id === editionId)
  if (!edition) {
    throw new MockApiError('NOT_FOUND', 'Edição não encontrada para este NFT.')
  }
  return edition
}

function listPrice(nft: NftRecord): EthAmount {
  return findEdition(nft, nft.defaultEditionId).price
}

export function toSummary(nft: NftRecord): NftSummary {
  return {
    id: nft.id,
    name: nft.name,
    tokenId: nft.tokenId,
    image: coverImage(nft.imageKey, nft.name),
    collection: { id: nft.collectionId, name: collectionName(nft.collectionId) },
    network: nft.network,
    price: listPrice(nft),
    previousPrice: nft.previousPrice,
    rarity: nft.rarity,
    isNew: nft.isNew,
    isTrending: nft.isTrending,
    soldOut: nft.editions.every((edition) => edition.available === 0),
    defaultEditionId: nft.defaultEditionId,
    version: nft.version,
    listedAt: nft.listedAt,
  }
}

export function toDetail(nft: NftRecord): NftDetail {
  return {
    ...toSummary(nft),
    description: nft.description,
    story: nft.story,
    gallery: galleryImages(nft.imageKey, nft.name),
    editions: nft.editions,
    attributes: nft.attributes,
    rating: nft.rating,
    creator: nft.creator,
    contract: nft.contract,
  }
}

const comparators: Record<NftListQuery['sort'], (a: NftRecord, b: NftRecord) => number> = {
  recent: (a, b) => Date.parse(b.listedAt) - Date.parse(a.listedAt),
  'price-asc': (a, b) => new Decimal(listPrice(a)).comparedTo(listPrice(b)),
  'price-desc': (a, b) => new Decimal(listPrice(b)).comparedTo(listPrice(a)),
  name: (a, b) => a.name.localeCompare(b.name, 'pt-BR'),
}

export function listNfts(state: DbState, query: NftListQuery): NftListResponse {
  const search = normalize(query.q)
  const minPrice = query.minPrice ? new Decimal(query.minPrice) : null
  const maxPrice = query.maxPrice ? new Decimal(query.maxPrice) : null

  const matches = visibleNfts(state).filter((nft) => {
    const price = new Decimal(listPrice(nft))
    const searchable = normalize(`${nft.name} ${nft.tokenId} ${collectionName(nft.collectionId)}`)
    return (
      (search === '' || searchable.includes(search)) &&
      (query.collection.length === 0 || query.collection.includes(nft.collectionId)) &&
      (query.network.length === 0 || query.network.includes(nft.network)) &&
      (minPrice === null || price.gte(minPrice)) &&
      (maxPrice === null || price.lte(maxPrice)) &&
      (query.tab !== 'new' || nft.isNew) &&
      (query.tab !== 'trending' || nft.isTrending)
    )
  })

  // O id desempata para a ordem ser estável entre páginas.
  const compare = comparators[query.sort]
  matches.sort((a, b) => compare(a, b) || a.id.localeCompare(b.id))

  const start = (query.page - 1) * query.pageSize
  return {
    items: matches.slice(start, start + query.pageSize).map(toSummary),
    page: query.page,
    pageSize: query.pageSize,
    totalItems: matches.length,
    totalPages: Math.ceil(matches.length / query.pageSize),
  }
}

export function buildFacets(state: DbState): NftFacets {
  const nfts = visibleNfts(state)
  const prices = nfts.map((nft) => new Decimal(listPrice(nft)))

  return {
    collections: collections.map(({ id, name }) => ({
      id,
      name,
      count: nfts.filter((nft) => nft.collectionId === id).length,
    })),
    networks: networkIds.map((id) => ({
      id,
      name: networks[id].name,
      count: nfts.filter((nft) => nft.network === id).length,
    })),
    price: {
      min: prices.length > 0 ? Decimal.min(...prices).toFixed() : '0',
      max: prices.length > 0 ? Decimal.max(...prices).toFixed() : '0',
    },
  }
}
