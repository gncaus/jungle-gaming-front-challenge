import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { NftImage } from '@/features/catalog/components/nft-image'
import { nftHighlightsQueryOptions } from '@/features/catalog/hooks/queries'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

const artClass = 'size-[140px] shrink-0 rounded-2xl md:size-[320px] md:rounded-[28px] xl:size-[450px]'
const artSizes = '(min-width: 1280px) 450px, (min-width: 768px) 320px, 140px'

/**
 * Topo da página inicial. O texto é fixo (e mais curto no mobile, como no layout);
 * a arte vem dos destaques da API e troca pelos indicadores.
 */
export function Hero() {
  const [active, setActive] = useState(0)
  const { data, isPending } = useQuery(nftHighlightsQueryOptions)
  const slides = data?.hero ?? []
  const nft = slides[active] ?? slides[0]

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="NFTs em destaque"
      className="bg-surface-raised md:bg-background relative flex items-start gap-3 rounded-[28px] p-4 pb-9 md:items-center md:rounded-none md:p-0 md:py-8 md:pl-10 xl:items-start xl:gap-0 xl:pt-[33px] xl:pb-0"
    >
      <div className="min-w-0 flex-1 xl:pt-10">
        <p className="text-[13px] tracking-widest md:text-sm">Bem-vindo à Kurio</p>
        <h1 className="mt-2 text-lg leading-8 font-medium uppercase md:mt-3 md:text-[32px] md:leading-[52px] md:font-bold xl:mt-2 xl:max-w-[520px] xl:text-[43px] xl:leading-[70px]">
          <span className="md:hidden">Seja dono da cultura digital</span>
          <span className="hidden md:inline">Seja dono do futuro da arte digital</span>
        </h1>
        <p className="text-text-secondary mt-1 text-sm leading-[22px] md:leading-6">
          <span className="md:hidden">Descubra NFTs selecionados de criadores do mundo todo.</span>
          <span className="hidden md:inline">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara,
            apoie artistas e tenha uma parte da cultura da internet.
          </span>
        </p>
        <a
          href="#catalogo"
          className="text-text-accent hover:text-primary-light mt-1 inline-flex min-h-6 items-center gap-2 text-sm font-bold tracking-wide uppercase md:hidden"
        >
          Explorar <ArrowRight className="size-4" aria-hidden="true" />
        </a>
        <Button asChild className="mt-8 hidden h-10 w-[140px] tracking-wider uppercase md:inline-flex">
          <a href="#catalogo">Explorar</a>
        </Button>
      </div>

      {isPending && <Skeleton className={artClass} data-testid="hero-skeleton" />}
      {!isPending && !nft && <div className={cn(artClass, 'bg-card')} aria-hidden="true" />}
      {nft && (
        <Link to="/nft/$nftId" params={{ nftId: nft.id }} className={cn(artClass, 'block overflow-hidden md:order-last')}>
          <NftImage image={nft.image} sizes={artSizes} priority className="size-full" />
          <span className="sr-only">Ver {nft.name}</span>
        </Link>
      )}

      {slides.length > 1 && (
        <div
          role="group"
          aria-label="Escolher destaque"
          className="absolute inset-x-0 bottom-1.5 flex justify-center md:static md:mr-8 md:self-end md:pb-8 xl:mr-[94px] xl:pb-[35px]"
        >
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Destaque ${index + 1} de ${slides.length}: ${slide.name}`}
              aria-current={index === active ? 'true' : undefined}
              className="flex size-6 items-center justify-center rounded-full"
            >
              <span
                className={cn(
                  'size-2 rounded-full transition-colors',
                  index === active ? 'bg-primary' : 'bg-border-soft',
                )}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
