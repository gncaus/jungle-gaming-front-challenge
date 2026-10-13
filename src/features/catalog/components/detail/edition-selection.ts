import type { NftDetail, NftEdition } from '@/features/catalog/schemas'

/**
 * Edição a exibir: a pedida na URL, se existir; senão a padrão do NFT, se tiver estoque;
 * senão a primeira com estoque. Uma edição esgotada pedida pela URL é respeitada, para a
 * página dizer que ela está indisponível em vez de trocar de edição em silêncio.
 */
export function resolveEdition(nft: NftDetail, requestedId: string | undefined): NftEdition {
  const find = (id: string | undefined) => nft.editions.find((edition) => edition.id === id)
  const fallback = nft.editions[0]
  if (!fallback) {
    throw new Error(`O NFT ${nft.id} não tem edições`)
  }

  const requested = find(requestedId)
  if (requested) return requested

  const preferred = find(nft.defaultEditionId)
  if (preferred && preferred.available > 0) return preferred

  return nft.editions.find((edition) => edition.available > 0) ?? preferred ?? fallback
}

/** Maior quantidade que pode ser levada desta edição agora. */
export function maxQuantityOf(edition: NftEdition): number {
  return Math.min(edition.available, edition.maxPerOrder)
}
