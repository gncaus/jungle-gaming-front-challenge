import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { z } from 'zod'
import { CartItemRow, CartItemRowSkeleton, cartRowGrid } from '@/features/cart/components/cart-item-row'
import { CartSummary } from '@/features/cart/components/cart-summary'
import { useCart } from '@/features/cart/hooks/use-cart'
import { useCartChangeNotices } from '@/features/cart/hooks/use-cart-changes'
import { QuoteTotalsSkeleton } from '@/features/checkout/components/quote-totals'
import { NftShelf } from '@/features/catalog/components/nft-shelf'
import { Button } from '@/shared/ui/button'

export const Route = createFileRoute('/carrinho')({
  // O cupom aplicado fica na URL: sobrevive a refresh e segue para o pagamento.
  validateSearch: z.object({ cupom: z.string().trim().min(1).max(40).optional().catch(undefined) }),
  component: CartPage,
})

function CartPage() {
  const { cupom } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data: cart, error, isPending, refetch } = useCart()
  const notices = useCartChangeNotices(cart)
  const couponCode = cupom ? cupom.toUpperCase() : null

  function changeCoupon(code: string | null) {
    void navigate({ search: { cupom: code ?? undefined }, replace: true, resetScroll: false })
  }

  return (
    <div className="page-container pb-4">
      <div className="relative flex items-center justify-center py-4 md:hidden">
        <Link
          to="/"
          hash="catalogo"
          aria-label="Continuar explorando"
          className="bg-card hover:text-primary-light absolute left-0 flex size-10 items-center justify-center rounded-full transition-colors"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Link>
        <h1 className="text-lg font-bold">Carrinho de NFTs</h1>
      </div>

      <nav aria-label="Trilha" className="hidden pt-[30px] pb-3 text-sm font-bold md:block">
        <ol className="flex gap-2">
          <li>
            <Link to="/" className="hover:text-primary-light transition-colors">
              Início
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/" hash="catalogo" className="hover:text-primary-light transition-colors">
              Mercado
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Carrinho</li>
        </ol>
      </nav>
      <h1 className="sr-only hidden md:block">Carrinho de NFTs</h1>

      {isPending && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[minmax(0,1fr)_332px] md:gap-[86px]" aria-busy="true">
          <div className="flex flex-col gap-3 md:pt-[42px]" data-testid="cart-skeleton">
            <p role="status" className="sr-only">
              Carregando carrinho…
            </p>
            {Array.from({ length: 3 }, (_, index) => (
              <CartItemRowSkeleton key={index} />
            ))}
          </div>
          <div className="md:pt-[150px]">
            <QuoteTotalsSkeleton />
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="bg-card flex flex-col items-start gap-4 p-8">
          <h2 className="text-lg font-bold">Não foi possível carregar o carrinho</h2>
          <p className="text-muted-foreground text-sm">{error.message}</p>
          <Button onClick={() => void refetch()}>Tentar novamente</Button>
        </div>
      )}

      {cart?.items.length === 0 && (
        <div className="bg-card flex flex-col items-start gap-4 p-8">
          <p role="status" className="text-lg font-bold">
            Seu carrinho está vazio
          </p>
          <p className="text-muted-foreground text-sm">Explore o catálogo e adicione os NFTs que quiser.</p>
          <Button asChild>
            <Link to="/" hash="catalogo">
              Explorar o catálogo
            </Link>
          </Button>
        </div>
      )}

      {cart && cart.items.length > 0 && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[minmax(0,1fr)_332px] md:items-start md:gap-[86px]">
          <section aria-labelledby="cart-items-title">
            <h2 id="cart-items-title" className="sr-only">
              Itens do carrinho
            </h2>
            <div
              aria-hidden="true"
              className={`hidden border-b pb-3 text-base font-bold ${cartRowGrid} md:items-end`}
            >
              <span>NFTs</span>
              <span>Preço</span>
              <span>Edições</span>
              <span>Total</span>
              <span />
            </div>
            <ul className="flex flex-col gap-3 md:mt-3">
              {cart.items.map((item) => (
                <CartItemRow key={item.id} item={item} notice={notices[item.id]} />
              ))}
            </ul>
          </section>

          <CartSummary
            cart={cart}
            couponCode={couponCode}
            onCouponChange={changeCoupon}
            actions={
              <>
                <Button asChild size="lg" className="h-[60px] w-full rounded-full md:h-10 md:rounded-sm">
                  <Link to="/pagamento" search={{ cupom: couponCode ?? undefined }}>
                    Conectar e finalizar
                  </Link>
                </Button>
                {/* No mobile o botão de voltar do topo já leva ao catálogo, como no layout. */}
                <Link
                  to="/"
                  hash="catalogo"
                  className="text-text-accent hover:text-primary-light hidden text-base transition-colors md:inline"
                >
                  Continuar explorando
                </Link>
              </>
            }
          />
        </div>
      )}

      {cart && (
        <div className="mt-16 md:mt-[100px]">
          <NftShelf
            title="Colecionadores também viram"
            filter={{}}
            excludeIds={cart.items.map((item) => item.nftId)}
          />
        </div>
      )}
    </div>
  )
}
