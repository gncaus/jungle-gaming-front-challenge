import type { NftImage } from '@/features/catalog/schemas'

/** Artes disponíveis em public/images/nfts, geradas por scripts/optimize-images.mjs. */
export const imageKeys = ['emerald-ape', 'sage-nomad', 'neon-vessel', 'golden-beat'] as const
export type ImageKey = (typeof imageKeys)[number]

const viewWidths = {
  full: [320, 480, 640, 1000],
  face: [320, 640],
  outfit: [320, 640],
  profile: [320, 640],
} as const

type ImageView = keyof typeof viewWidths

const viewLabels: Record<ImageView, string> = {
  full: 'arte completa',
  face: 'detalhe do rosto',
  outfit: 'detalhe do traje',
  profile: 'detalhe lateral',
}

const artDescriptions: Record<ImageKey, string> = {
  'emerald-ape': 'macaco de pelo castanho com óculos redondos e jaqueta universitária verde',
  'sage-nomad': 'gorila grisalho com chapéu de aba verde e moletom roxo',
  'neon-vessel': 'chimpanzé de pelo preto com gola alta verde e blazer bege',
  'golden-beat': 'macaco de pelo dourado com fones de ouvido verdes e jaqueta creme',
}

function buildImage(key: ImageKey, view: ImageView, nftName: string): NftImage {
  return {
    alt: `${nftName}: ${artDescriptions[key]}, ${viewLabels[view]}`,
    sources: viewWidths[view].map((width) => ({
      url: `/images/nfts/${key}-${view}-${width}.webp`,
      width,
    })),
  }
}

export function coverImage(key: ImageKey, nftName: string): NftImage {
  return buildImage(key, 'full', nftName)
}

export function galleryImages(key: ImageKey, nftName: string): NftImage[] {
  return (Object.keys(viewWidths) as ImageView[]).map((view) => buildImage(key, view, nftName))
}
