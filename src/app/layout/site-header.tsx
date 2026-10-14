import { Link, useLocation, useSearch } from '@tanstack/react-router'
import { Search, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { AccountMenu } from '@/app/layout/account-menu'
import { CartLink } from '@/features/cart/components/cart-link'
import { SearchForm } from '@/features/catalog/components/search-form'
import { cn } from '@/shared/lib/utils'

const navLinkClass =
  'inline-block border-b-2 border-transparent pb-[18px] text-base leading-6 transition-colors hover:text-primary-light'
const activeNavClass = 'border-primary text-text-accent font-bold'

/** Telas que pertencem ao "Mercado" no menu. */
const marketPaths = ['/nft/', '/carrinho', '/pagamento', '/pedido/']

/** Seções do menu que existem no layout, mas estão fora do escopo da entrega. */
const upcomingSections = ['Criadores', 'Aprenda']

/** Cabeçalho das telas a partir de 768 px. No mobile, a navegação fica na própria página. */
export function SiteHeader() {
  const [searchOpen, setSearchOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const pathname = useLocation({ select: (location) => location.pathname })
  const isHome = pathname === '/'
  // Como no layout: "Mercado" fica em destaque nas telas da jornada de compra.
  const isMarket = marketPaths.some((prefix) => pathname.startsWith(prefix))
  const currentQuery = useSearch({ strict: false, select: (search) => search.q ?? '' })

  function closeSearch() {
    setSearchOpen(false)
    toggleRef.current?.focus()
  }

  return (
    <header className="page-container hidden md:block">
      <div
        className="grid h-[68px] grid-cols-[1fr_auto_1fr] items-start border-b pt-6"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && searchOpen) closeSearch()
        }}
      >
        <Link to="/" className="mt-[7px] justify-self-start text-sm font-bold tracking-widest" aria-label="Kurio, página inicial">
          KURIO
        </Link>

        {/* A busca aberta ocupa o lugar do menu, para não cobrir os itens dele. */}
        {searchOpen ? (
          <SearchForm
            current={currentQuery}
            placeholder="Buscar NFTs"
            inputId="header-search"
            autoFocus
            className="-mt-[10px] w-[min(420px,40vw)]"
            onSubmitted={() => setSearchOpen(false)}
          />
        ) : (
          <nav aria-label="Principal">
            <ul className="flex gap-6 lg:gap-10">
              <li>
                <Link
                  to="/"
                  aria-current={isHome ? 'page' : undefined}
                  className={cn(navLinkClass, isHome && activeNavClass)}
                >
                  Início
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  hash="catalogo"
                  activeOptions={{ includeHash: true }}
                  aria-current={isMarket ? 'page' : undefined}
                  className={cn(navLinkClass, isMarket && activeNavClass)}
                >
                  Mercado
                </Link>
              </li>
              {upcomingSections.map((section) => (
                <li key={section}>
                  <span aria-disabled="true" className={cn(navLinkClass, 'text-brand-secondary cursor-default hover:text-brand-secondary')}>
                    {section}
                    <span className="sr-only"> (em breve)</span>
                  </span>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="-mt-3 flex items-center gap-3 justify-self-end">
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={searchOpen}
            aria-label={searchOpen ? 'Fechar busca' : 'Abrir busca'}
            onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
            className="hover:text-primary-light flex size-11 items-center justify-center rounded-sm transition-colors"
          >
            {searchOpen ? <X aria-hidden="true" /> : <Search aria-hidden="true" />}
          </button>
          <CartLink className="hover:text-primary-light size-11 rounded-sm" />
          <AccountMenu />
        </div>
      </div>
    </header>
  )
}
