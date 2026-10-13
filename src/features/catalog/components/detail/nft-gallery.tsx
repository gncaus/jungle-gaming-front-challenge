import { useState } from 'react'
import { NftImage } from '@/features/catalog/components/nft-image'
import type { NftImage as NftImageData } from '@/features/catalog/schemas'
import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui/skeleton'

const mainSizes = '(min-width: 1280px) 404px, (min-width: 768px) 45vw, 88vw'

/** Galeria do detalhe: miniaturas que trocam a imagem principal. */
export function NftGallery({ images }: { images: NftImageData[] }) {
  const [selected, setSelected] = useState(0)
  const current = images[selected] ?? images[0]
  if (!current) return null

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row md:gap-7">
      <ul aria-label="Imagens do NFT" className="flex gap-3 md:flex-col md:gap-4">
        {images.map((image, index) => (
          <li key={image.sources[0]?.url}>
            <button
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Ver imagem ${index + 1} de ${images.length}`}
              aria-current={index === selected ? 'true' : undefined}
              className={cn(
                'block size-16 overflow-hidden rounded-lg border-2 transition-colors md:size-[100px]',
                index === selected ? 'border-primary' : 'hover:border-border-soft border-transparent',
              )}
            >
              <NftImage image={{ ...image, alt: '' }} sizes="100px" className="size-full" />
            </button>
          </li>
        ))}
      </ul>
      <div className="bg-card flex-1 rounded-[28px] md:self-start md:rounded-sm md:p-5">
        <NftImage
          // A chave troca o elemento junto com a imagem, sem mostrar a anterior enquanto a nova carrega.
          key={current.sources[0]?.url}
          image={current}
          sizes={mainSizes}
          priority
          className="w-full rounded-[28px] md:rounded-3xl"
        />
      </div>
    </div>
  )
}

export function NftGallerySkeleton() {
  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row md:gap-7">
      <div className="flex gap-3 md:flex-col md:gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="size-16 rounded-lg md:size-[100px]" />
        ))}
      </div>
      <Skeleton className="aspect-square flex-1 rounded-[28px] md:self-start md:rounded-sm" />
    </div>
  )
}
