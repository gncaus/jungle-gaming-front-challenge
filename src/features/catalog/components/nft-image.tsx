import type { NftImage as NftImageData } from '@/features/catalog/schemas'
import { cn } from '@/shared/lib/utils'

interface NftImageProps {
  image: NftImageData
  /** Largura que a imagem ocupa em cada tamanho de tela, no formato do atributo `sizes`. */
  sizes: string
  /** Imagem acima da dobra: carrega já e com prioridade. As demais carregam sob demanda. */
  priority?: boolean
  className?: string
}

/** Arte quadrada do NFT, com `srcset` e dimensões declaradas para não deslocar o layout. */
export function NftImage({ image, sizes, priority = false, className }: NftImageProps) {
  const largest = image.sources.at(-1)
  if (!largest) return null

  return (
    <img
      src={largest.url}
      srcSet={image.sources.map((source) => `${source.url} ${source.width}w`).join(', ')}
      sizes={sizes}
      width={largest.width}
      height={largest.width}
      alt={image.alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={cn('aspect-square object-cover', className)}
    />
  )
}
