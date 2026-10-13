import type { CreateOrderData } from '@/features/orders/schemas'
import { readPrivate, removePrivate, writePrivate } from '@/shared/lib/private-storage'

interface PurchaseAttempt {
  /** Chave de idempotência enviada com o pedido. */
  key: string
  /** O conteúdo que a chave representa. Conteúdo diferente é outra tentativa, com outra chave. */
  content: string
}

const storageName = 'purchase-attempt'

/**
 * Devolve a chave de idempotência para este conteúdo de pedido.
 *
 * A chave é gerada uma vez por tentativa e fica guardada no navegador. Enquanto o usuário
 * reenviar o mesmo pedido (clique repetido, nova tentativa após timeout, refresh no meio),
 * a chave é a mesma e a API devolve o pedido já criado. Se algo mudar (valores confirmados,
 * cupom, carteira ou observação), é uma tentativa nova, com chave nova.
 */
export function idempotencyKeyFor(userId: string, input: CreateOrderData): string {
  const content = JSON.stringify(input)
  const stored = readPrivate<PurchaseAttempt>(userId, storageName)
  if (stored?.content === content) {
    return stored.key
  }
  const attempt: PurchaseAttempt = { key: crypto.randomUUID(), content }
  writePrivate(userId, storageName, attempt)
  return attempt.key
}

/** O pedido chegou a um estado final: a próxima compra, mesmo idêntica, é outra tentativa. */
export function finishPurchaseAttempt(userId: string): void {
  removePrivate(userId, storageName)
}
