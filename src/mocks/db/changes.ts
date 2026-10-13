import type { NftRecord, OrderRecord } from '@/mocks/db/types'

export interface ResourceChange {
  resource: 'nft' | 'order'
  id: string
}

type Publisher = (changes: ResourceChange[]) => void

let pending: ResourceChange[] = []
let publisher: Publisher | null = null

/**
 * Único ponto por onde preço, disponibilidade e estado de pedido mudam de versão.
 * A mudança fica na fila e vira evento depois que o banco é gravado, então
 * REST e tempo real sempre contam a mesma história.
 */
export function markNftChanged(nft: NftRecord): void {
  nft.version += 1
  pending.push({ resource: 'nft', id: nft.id })
}

export function markOrderChanged(order: OrderRecord): void {
  order.version += 1
  order.updatedAt = new Date().toISOString()
  pending.push({ resource: 'order', id: order.id })
}

/** O servidor de socket do mock se registra aqui para receber as mudanças gravadas. */
export function setChangePublisher(next: Publisher): void {
  publisher = next
}

/** Entrega as mudanças acumuladas, uma por recurso, depois que o banco foi gravado. */
export function publishPendingChanges(): void {
  if (pending.length === 0) return

  const unique = new Map(pending.map((change) => [`${change.resource}:${change.id}`, change]))
  pending = []
  publisher?.([...unique.values()])
}
