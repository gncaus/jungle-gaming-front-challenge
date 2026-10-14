import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { CatalogSearch } from '@/features/catalog/search'
import { Button } from '@/shared/ui/button'

interface Banner {
  title: string
  description: string
  image: string
  /** Recorte do catálogo para onde o botão leva. */
  search: Partial<CatalogSearch>
  linkLabel: string
}

const banners: Banner[] = [
  {
    title: 'Lançamentos gênesis de edição limitada',
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: '/images/nfts/emerald-ape-full-640.webp',
    search: { tab: 'new' },
    linkLabel: 'Explorar novos lançamentos',
  },
  {
    title: 'Arte digital selecionada e muito mais',
    description: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: '/images/nfts/neon-vessel-full-640.webp',
    search: { collection: ['arte-digital'] },
    linkLabel: 'Explorar a coleção Arte digital',
  },
]

export function PromoBanners() {
  return (
    <section aria-label="Seleções em destaque" className="grid gap-6 md:grid-cols-2 xl:gap-7">
      {banners.map((banner) => (
        <article key={banner.title} className="bg-card flex overflow-hidden rounded-lg xl:h-[250px]">
          <img
            // `loading` antes de `src`: ver o comentário em nft-image.tsx.
            loading="lazy"
            decoding="async"
            src={banner.image}
            alt=""
            width={640}
            height={640}
            className="w-[42%] shrink-0 rounded-2xl object-cover xl:w-[287px]"
          />
          <div className="flex min-w-0 flex-1 flex-col items-end justify-center gap-3 p-4 text-right xl:gap-2 xl:py-6 xl:pr-6 xl:pl-2">
            <h2 className="text-base font-bold xl:text-lg xl:leading-6">{banner.title}</h2>
            <p className="text-text-secondary text-sm leading-6 xl:text-[13px] xl:leading-[22px]">{banner.description}</p>
            <Button asChild className="w-[140px]">
              <Link
                to="/"
                search={{ ...banner.search, page: 1 }}
                hash="catalogo"
                aria-label={banner.linkLabel}
              >
                Explorar <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </article>
      ))}
    </section>
  )
}
