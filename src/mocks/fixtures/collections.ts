import type { NetworkId } from '@/features/catalog/schemas'
import type { EthAmount } from '@/shared/lib/money'

export const collections = [
  { id: 'arte-digital', name: 'Arte digital' },
  { id: 'fotografia', name: 'Fotografia' },
  { id: 'musica', name: 'Música' },
  { id: 'arte-3d', name: 'Arte 3D' },
  { id: 'colecionaveis', name: 'Colecionáveis' },
  { id: 'generativa', name: 'Generativa' },
  { id: 'jogos', name: 'Jogos' },
  { id: 'assinaturas', name: 'Assinaturas' },
  { id: 'utilidade', name: 'Utilidade' },
] as const

export type CollectionId = (typeof collections)[number]['id']

export function collectionName(id: string): string {
  return collections.find((collection) => collection.id === id)?.name ?? id
}

export const networks: Record<NetworkId, { name: string; fee: EthAmount }> = {
  ethereum: { name: 'Ethereum', fee: '0.016' },
  polygon: { name: 'Polygon', fee: '0.002' },
  solana: { name: 'Solana', fee: '0.001' },
}
