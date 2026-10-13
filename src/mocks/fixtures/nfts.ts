import Decimal from 'decimal.js'
import type { NetworkId } from '@/features/catalog/schemas'
import type { EditionRecord, NftRecord } from '@/mocks/db/types'
import { collectionName, networks, type CollectionId } from '@/mocks/fixtures/collections'
import type { ImageKey } from '@/mocks/fixtures/images'
import { toEthAmount, type EthAmount } from '@/shared/lib/money'

interface NftSeed {
  name: string
  token: number
  image: ImageKey
  collection: CollectionId
  network: NetworkId
  /** Preço da edição padrão (1/50). */
  price: EthAmount
  previousPrice?: EthAmount
  rare?: true
  isNew?: true
  trending?: true
  soldOut?: true
}

/** Do mais recente para o mais antigo: a posição define a data de listagem. */
const seeds: NftSeed[] = [
  { name: 'Emerald Ape', token: 42, image: 'emerald-ape', collection: 'colecionaveis', network: 'ethereum', price: '1.19', trending: true },
  { name: 'Sage Nomad', token: 9, image: 'sage-nomad', collection: 'arte-digital', network: 'ethereum', price: '1.69', isNew: true },
  { name: 'Neon Vessel', token: 552, image: 'neon-vessel', collection: 'arte-digital', network: 'ethereum', price: '1.99', previousPrice: '2.29', rare: true },
  { name: 'Cosmic Bloom', token: 118, image: 'sage-nomad', collection: 'generativa', network: 'polygon', price: '1.29' },
  { name: 'Violet Nomad', token: 314, image: 'sage-nomad', collection: 'colecionaveis', network: 'ethereum', price: '1.39', trending: true },
  { name: 'Ivory Baron', token: 88, image: 'neon-vessel', collection: 'arte-3d', network: 'ethereum', price: '1.79' },
  { name: 'Golden Beat', token: 207, image: 'golden-beat', collection: 'musica', network: 'solana', price: '0.99', isNew: true },
  { name: 'Golden Frequency', token: 71, image: 'golden-beat', collection: 'musica', network: 'solana', price: '0.59' },
  { name: 'Golden Signal', token: 160, image: 'golden-beat', collection: 'musica', network: 'polygon', price: '0.39', trending: true },
  { name: 'Jade Regent', token: 301, image: 'emerald-ape', collection: 'arte-3d', network: 'ethereum', price: '3.45', rare: true },
  { name: 'Midnight Curator', token: 27, image: 'neon-vessel', collection: 'fotografia', network: 'ethereum', price: '2.1' },
  { name: 'Lilac Drifter', token: 415, image: 'sage-nomad', collection: 'fotografia', network: 'polygon', price: '0.45', isNew: true },
  { name: 'Amber Echo', token: 233, image: 'golden-beat', collection: 'generativa', network: 'solana', price: '0.72' },
  { name: 'Velvet Scholar', token: 64, image: 'neon-vessel', collection: 'assinaturas', network: 'ethereum', price: '5.8', rare: true },
  { name: 'Moss Wanderer', token: 512, image: 'sage-nomad', collection: 'jogos', network: 'polygon', price: '0.18' },
  { name: 'Royal Emerald', token: 3, image: 'emerald-ape', collection: 'colecionaveis', network: 'ethereum', price: '12.3', rare: true, trending: true },
  { name: 'Sunset Rhythm', token: 190, image: 'golden-beat', collection: 'musica', network: 'ethereum', price: '1.05' },
  { name: 'Onyx Diplomat', token: 77, image: 'neon-vessel', collection: 'utilidade', network: 'polygon', price: '0.95' },
  { name: 'Varsity Legend', token: 144, image: 'emerald-ape', collection: 'jogos', network: 'solana', price: '0.66', isNew: true },
  { name: 'Lavender Sage', token: 268, image: 'sage-nomad', collection: 'arte-digital', network: 'solana', price: '0.34' },
  { name: 'Bass Prophet', token: 333, image: 'golden-beat', collection: 'generativa', network: 'ethereum', price: '1.49', previousPrice: '1.89' },
  { name: 'Obsidian Poet', token: 121, image: 'neon-vessel', collection: 'fotografia', network: 'solana', price: '0.88' },
  { name: 'Clover Captain', token: 58, image: 'emerald-ape', collection: 'utilidade', network: 'ethereum', price: '2.75' },
  { name: 'Mist Nomad', token: 402, image: 'sage-nomad', collection: 'arte-3d', network: 'polygon', price: '0.27' },
  { name: 'Honey Tempo', token: 286, image: 'golden-beat', collection: 'jogos', network: 'polygon', price: '0.12', isNew: true },
  { name: 'Graphite Baron', token: 95, image: 'neon-vessel', collection: 'colecionaveis', network: 'ethereum', price: '4.2', trending: true },
  { name: 'Pine Maverick', token: 176, image: 'emerald-ape', collection: 'arte-digital', network: 'polygon', price: '0.83' },
  { name: 'Orchid Pilgrim', token: 349, image: 'sage-nomad', collection: 'assinaturas', network: 'solana', price: '0.51' },
  { name: 'Copper Chorus', token: 224, image: 'golden-beat', collection: 'arte-3d', network: 'solana', price: '0.47' },
  { name: 'Shadow Envoy', token: 39, image: 'neon-vessel', collection: 'generativa', network: 'ethereum', price: '2.95', soldOut: true },
  { name: 'Forest Ace', token: 261, image: 'emerald-ape', collection: 'fotografia', network: 'solana', price: '0.29' },
  { name: 'Plum Voyager', token: 487, image: 'sage-nomad', collection: 'utilidade', network: 'ethereum', price: '1.15', isNew: true },
  { name: 'Saffron Loop', token: 312, image: 'golden-beat', collection: 'assinaturas', network: 'polygon', price: '0.02' },
  { name: 'Ebony Mentor', token: 153, image: 'neon-vessel', collection: 'jogos', network: 'ethereum', price: '1.62' },
  { name: 'Ivy Champion', token: 20, image: 'emerald-ape', collection: 'generativa', network: 'ethereum', price: '6.4', rare: true },
  { name: 'Dusk Harmony', token: 445, image: 'golden-beat', collection: 'arte-digital', network: 'polygon', price: '0.76', trending: true },
]

const imageAttributes: Record<ImageKey, string[]> = {
  'emerald-ape': ['Óculos', 'Esmeralda'],
  'sage-nomad': ['Chapéu', 'Moletom'],
  'neon-vessel': ['Gola alta', 'Brinco'],
  'golden-beat': ['Fones', 'Jaqueta'],
}

const creators = ['Nova Sato', 'Lia Okafor', 'Téo Marchetti', 'Iara Benedetti']
const newestListing = Date.UTC(2026, 6, 29, 12)
const hoursBetweenListings = 36

function scaled(price: EthAmount, factor: string): EthAmount {
  return toEthAmount(new Decimal(price).times(factor).toDecimalPlaces(3))
}

function buildEditions(seed: NftSeed, index: number): EditionRecord[] {
  const editions: EditionRecord[] = [
    { id: 'unique', label: '1/1', price: scaled(seed.price, '6'), available: index % 4 === 0 ? 0 : 1, maxPerOrder: 1 },
    { id: 'limited-10', label: '1/10', price: scaled(seed.price, '2.5'), available: (index % 5) + 1, maxPerOrder: 5 },
    { id: 'limited-50', label: '1/50', price: seed.price, available: 12 + ((index * 7) % 30), maxPerOrder: 10 },
    { id: 'open', label: 'ABERTA', price: scaled(seed.price, '0.5'), available: 500, maxPerOrder: 20 },
  ]
  return seed.soldOut ? editions.map((edition) => ({ ...edition, available: 0 })) : editions
}

function buildNft(seed: NftSeed, index: number): NftRecord {
  const token = String(seed.token).padStart(3, '0')
  const name = `${seed.name} #${token}`
  const collection = collectionName(seed.collection)
  const network = networks[seed.network].name
  const creator = creators[index % creators.length] ?? 'Nova Sato'
  const royalty = 5 + (index % 3)
  const addressSeed = (seed.token * 2654435761) >>> 0

  return {
    id: `${seed.name.toLowerCase().replaceAll(' ', '-')}-${token}`,
    name,
    tokenId: `#${String(seed.token).padStart(4, '0')}`,
    imageKey: seed.image,
    collectionId: seed.collection,
    network: seed.network,
    previousPrice: seed.previousPrice ?? null,
    rarity: seed.rare ? 'rare' : 'common',
    isNew: seed.isNew ?? false,
    isTrending: seed.trending ?? false,
    listedAt: new Date(newestListing - index * hoursBetweenListings * 3_600_000).toISOString(),
    description: `Um colecionável digital finalizado à mão da coleção ${collection}, verificado na ${network}, com arte desbloqueável e acesso para colecionadores.`,
    story: [
      `${name} é uma obra digital finalizada à mão da coleção ${collection}. Cada atributo fica armazenado nos metadados do token e verificado na ${network}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      `A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. ${creator} recebe ${royalty}% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.`,
    ],
    attributes: [...imageAttributes[seed.image], seed.rare ? 'Raro' : 'Comum'],
    rating: { average: 4 + ((index * 3) % 10) / 10, count: 5 + ((index * 7) % 40) },
    creator: { name: creator, royaltyPercent: royalty },
    contract: {
      address: `0x${addressSeed.toString(16).padStart(8, '0').toUpperCase()}...${token}E8`,
      standard: 'ERC-721',
    },
    editions: buildEditions(seed, index),
    defaultEditionId: 'limited-50',
    version: 1,
  }
}

export function buildNftFixtures(): NftRecord[] {
  return seeds.map(buildNft)
}
