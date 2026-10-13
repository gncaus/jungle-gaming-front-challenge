import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { useSession } from '@/features/auth/hooks/use-session'
import { requireSession } from '@/features/auth/search'
import { cartKeys, useCart } from '@/features/cart/hooks/use-cart'
import { OrderItems } from '@/features/checkout/components/order-items'
import { QuoteTotals, QuoteTotalsSkeleton } from '@/features/checkout/components/quote-totals'
import { WalletConnection } from '@/features/checkout/components/wallet-connection'
import { WalletPicker } from '@/features/checkout/components/wallet-picker'
import { quoteKeys, useQuote } from '@/features/checkout/hooks/use-quote'
import { useCreateOrder } from '@/features/orders/hooks/use-orders'
import { useProfile } from '@/features/profile/hooks/use-profile'
import { WalletForm } from '@/features/wallets/components/wallet-form'
import { useWallets, walletKeys } from '@/features/wallets/hooks/use-wallets'
import { slotNames } from '@/features/wallets/labels'
import type { WalletSlot } from '@/features/wallets/schemas'
import { HttpError } from '@/shared/lib/http'
import { formatEth } from '@/shared/lib/money'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

export const Route = createFileRoute('/pagamento')({
  staticData: { requiresAuth: true },
  beforeLoad: requireSession,
  // O cupom aplicado no carrinho chega pela URL.
  validateSearch: z.object({ cupom: z.string().trim().min(1).max(40).optional().catch(undefined) }),
  component: CheckoutPage,
})

/** Valores que o usuário viu e aceitou. O pedido só é enviado com a cotação nessa versão. */
interface Acknowledged {
  version: string
  total: string
}

function CheckoutPage() {
  const { cupom } = Route.useSearch()
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const { user } = useSession()
  const couponCode = cupom ? cupom.toUpperCase() : null

  const cart = useCart()
  const wallets = useWallets()
  const profile = useProfile()
  const quote = useQuote(cart.data, couponCode)
  const createOrder = useCreateOrder()

  const [slot, setSlot] = useState<WalletSlot>('primary')
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState('')
  const [failure, setFailure] = useState('')
  const [acknowledged, setAcknowledged] = useState<Acknowledged | null>(null)

  // A primeira cotação exibida é a que o usuário está vendo ao chegar: fica como a aceita.
  if (quote.data && !acknowledged) {
    setAcknowledged({ version: quote.data.version, total: quote.data.total })
  }

  // O perfil preenche as sugestões do formulário de carteira, que são lidas uma vez, na
  // montagem: por isso a tela espera por ele também.
  if (cart.isPending || wallets.isPending || profile.isPending) {
    return (
      <div className="page-container grid min-h-dvh gap-8 py-10 md:grid-cols-[minmax(0,1fr)_405px]" aria-busy="true">
        <p role="status" className="sr-only">
          Carregando pagamento…
        </p>
        <Skeleton className="h-96 w-full" data-testid="checkout-skeleton" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (cart.isError || wallets.isError) {
    const loadError = cart.error ?? wallets.error
    return (
      <section role="alert" className="page-container flex flex-col items-start gap-4 py-24">
        <h1 className="text-heading-lg font-bold">Não foi possível carregar o pagamento</h1>
        <p className="text-muted-foreground text-sm">{loadError?.message}</p>
        <Button
          onClick={() => {
            void cart.refetch()
            void wallets.refetch()
          }}
        >
          Tentar novamente
        </Button>
      </section>
    )
  }

  if (cart.data.items.length === 0) {
    return (
      <section className="page-container flex flex-col items-start gap-4 py-24">
        <h1 className="text-heading-lg font-bold">Pagamento</h1>
        <p role="status" className="text-lg font-bold">
          Seu carrinho está vazio
        </p>
        <Button asChild>
          <Link to="/" hash="catalogo">
            Explorar o catálogo
          </Link>
        </Button>
      </section>
    )
  }

  const wallet = wallets.data[slot]
  const quoteError = quote.error instanceof HttpError ? quote.error : null
  const stockBlocked = quoteError?.code === 'INSUFFICIENT_STOCK'
  const valuesChanged = Boolean(quote.data && acknowledged && quote.data.version !== acknowledged.version)

  // O que ainda impede a confirmação, em ordem; aparece escrito junto do botão.
  const blockers = [
    !wallet && `Cadastre a carteira ${slotNames[slot].toLowerCase()}.`,
    wallet && wallet.connection !== 'connected' && 'Conecte a carteira.',
    stockBlocked && 'Ajuste as quantidades no carrinho.',
    quoteError && !stockBlocked && 'Resolva o problema com os valores do pedido.',
    valuesChanged && 'Revise os novos valores do pedido.',
  ].filter((blocker): blocker is string => typeof blocker === 'string')

  function refreshPrices() {
    if (!user) return
    void queryClient.invalidateQueries({ queryKey: cartKeys.detail(user.id) })
    void queryClient.invalidateQueries({ queryKey: quoteKeys.all(user.id) })
  }

  function confirmPurchase() {
    if (!quote.data || !wallet || blockers.length > 0 || createOrder.isPending) return
    setFailure('')
    createOrder.mutate(
      { quoteVersion: quote.data.version, couponCode, walletSlot: slot, note: note.trim() },
      {
        onSuccess: (order) => void navigate({ to: '/pedido/$orderId', params: { orderId: order.id } }),
        onError: (error) => {
          const code = error instanceof HttpError ? error.code : null
          if (code === 'QUOTE_STALE' || code === 'INSUFFICIENT_STOCK') {
            // A tela mostrava valores que já mudaram: busca os atuais, que pedirão nova confirmação.
            refreshPrices()
            setFailure(error.message)
          } else if (code === 'WALLET_NOT_CONNECTED') {
            if (user) void queryClient.invalidateQueries({ queryKey: walletKeys.list(user.id) })
            setFailure(error.message)
          } else if (error instanceof HttpError && error.isSessionLost) {
            // O login reabre sozinho e devolve o usuário a esta tela.
          } else if (error instanceof HttpError && error.isTransient) {
            setFailure(
              'Não foi possível confirmar se o pedido foi criado. Tente novamente: se ele já existir, será recuperado, sem compra em dobro.',
            )
          } else {
            setFailure(error.message)
          }
        },
      },
    )
  }

  return (
    <div className="page-container pb-4">
      <nav aria-label="Trilha" className="hidden pt-[30px] pb-3 text-sm font-bold md:block">
        <ol className="flex gap-2">
          <li>
            <Link to="/" className="hover:text-primary-light transition-colors">
              Início
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/carrinho" search={{ cupom }} className="hover:text-primary-light transition-colors">
              Carrinho
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Pagamento</li>
        </ol>
      </nav>
      <h1 className="py-4 text-center text-lg font-bold md:sr-only">Pagamento com carteira</h1>

      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_340px] md:items-start xl:grid-cols-[minmax(0,1fr)_405px]">
        <div className="flex flex-col gap-6">
          <WalletPicker
            wallets={wallets.data}
            selected={slot}
            onSelect={(next) => {
              setSlot(next)
              setEditing(false)
            }}
          />

          <section aria-labelledby="wallet-data-title">
            <div className="flex items-center justify-between gap-3">
              <h2 id="wallet-data-title" className="text-lg font-bold">
                Dados da carteira {slotNames[slot].toLowerCase()}
              </h2>
              {wallet && (
                <button
                  type="button"
                  onClick={() => setEditing((current) => !current)}
                  aria-expanded={editing}
                  className="text-text-accent hover:text-primary-light rounded-sm text-sm font-bold md:hidden"
                >
                  {editing ? 'Fechar' : 'Editar'}
                </button>
              )}
            </div>
            {/* No mobile, os dados de uma carteira já cadastrada só abrem ao editar. */}
            <div className={cn('mt-4', wallet && !editing && 'hidden md:block')}>
              <WalletForm
                // Trocar de carteira, ou salvar, recomeça o formulário com os dados daquela carteira.
                key={`${slot}:${wallet?.updatedAt ?? 'new'}`}
                slot={slot}
                wallet={wallet}
                suggestions={{
                  displayName: profile.data?.displayName ?? '',
                  nickname: profile.data?.walletNickname ?? '',
                  email: profile.data?.email ?? '',
                  ensName: profile.data?.ensName ?? '',
                }}
                onSaved={() => setEditing(false)}
              />
            </div>
          </section>

          <div>
            <label htmlFor="collector-note" className="mb-2 block text-sm">
              Observação do colecionador (opcional)
            </label>
            <textarea
              id="collector-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={280}
              rows={5}
              className="bg-background md:bg-card focus-visible:border-primary w-full max-w-[350px] rounded-lg border p-3 text-sm md:rounded-sm"
            />
          </div>
        </div>

        <section aria-labelledby="order-summary-title" className="flex flex-col gap-4">
          <h2 id="order-summary-title" className="text-lg font-bold">
            Seus NFTs
          </h2>

          {quote.isPending && (
            <>
              <Skeleton className="h-[70px] w-full" />
              <QuoteTotalsSkeleton />
            </>
          )}
          {quote.data && (
            <>
              <OrderItems items={quote.data.items} />
              <p className="text-center text-sm">
                Tem um código promocional?{' '}
                <Link
                  to="/carrinho"
                  search={{ cupom }}
                  className="text-text-accent hover:text-primary-light underline underline-offset-4"
                >
                  Aplique no carrinho
                </Link>
              </p>
              <QuoteTotals quote={quote.data} />
            </>
          )}
          {quoteError && (
            <div role="alert" className="flex flex-col items-start gap-2 text-sm">
              <p>{quoteError.message}</p>
              <Button asChild size="sm" variant="outline">
                <Link to="/carrinho" search={{ cupom: stockBlocked ? cupom : undefined }}>
                  Voltar ao carrinho
                </Link>
              </Button>
            </div>
          )}

          {valuesChanged && quote.data && acknowledged && (
            <div role="alert" className="border-primary flex flex-col items-start gap-3 rounded-sm border p-4 text-sm">
              <p>
                <span className="font-bold">Os valores do pedido mudaram.</span> O total era{' '}
                {formatEth(acknowledged.total)} e agora é {formatEth(quote.data.total)}. Confira o resumo acima
                antes de confirmar.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  if (quote.data) setAcknowledged({ version: quote.data.version, total: quote.data.total })
                  setFailure('')
                }}
              >
                Revisei os novos valores
              </Button>
            </div>
          )}

          <h2 className="mt-2 text-center text-lg font-bold">Carteira e rede</h2>
          <WalletConnection wallet={wallet} />

          <Button
            size="lg"
            className="h-[60px] w-full rounded-full md:h-[45px] md:rounded-md"
            onClick={confirmPurchase}
            disabled={!quote.data || blockers.length > 0 || createOrder.isPending}
            aria-describedby="checkout-blockers"
          >
            {createOrder.isPending ? 'Enviando pedido…' : 'Confirmar compra'}
          </Button>
          <ul id="checkout-blockers" className="text-text-secondary flex flex-col gap-1 text-sm empty:hidden">
            {blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
          <p role="alert" className="text-text-coral text-sm empty:hidden">
            {failure}
          </p>
        </section>
      </div>
    </div>
  )
}
