import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import { WalletFields } from '@/features/wallets/components/wallet-form'
import { useWalletForm, walletDefaults } from '@/features/wallets/hooks/use-wallet-form'
import { useSaveWallet, useWallets, walletKeys } from '@/features/wallets/hooks/use-wallets'
import { slotNames } from '@/features/wallets/labels'
import type { WalletSlot } from '@/features/wallets/schemas'
import { announce } from '@/shared/lib/announce'
import { applyApiError } from '@/shared/lib/form-errors'
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
  /** Carteira com o formulário aberto no mobile (no desktop o formulário fica sempre à vista). */
  const [editing, setEditing] = useState<WalletSlot | null>(null)
  const [note, setNote] = useState('')
  const [failure, setFailure] = useState('')
  const [acknowledged, setAcknowledged] = useState<Acknowledged | null>(null)

  const saveWalletMutation = useSaveWallet()
  const walletForm = useWalletForm(null)
  const provider = walletForm.watch('provider')

  // O formulário mostra a carteira escolhida: recomeça quando ela muda (outra escolhida, salva
  // ou conectada) e, para um cadastro novo, parte das sugestões do perfil.
  useEffect(() => {
    walletForm.reset(
      walletDefaults(wallets.data?.[slot] ?? null, {
        displayName: profile.data?.displayName ?? '',
        nickname: profile.data?.walletNickname ?? '',
        email: profile.data?.email ?? '',
        ensName: profile.data?.ensName ?? '',
      }),
    )
  }, [walletForm, wallets.data, profile.data, slot])

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
  // Dados novos ou alterados ainda não foram salvos: conectar salva antes.
  const unsaved = !wallet || walletForm.formState.isDirty

  // O que ainda impede a confirmação, em ordem; aparece escrito junto do botão.
  const blockers = [
    !wallet && `Cadastre a carteira ${slotNames[slot].toLowerCase()}.`,
    wallet && (unsaved || wallet.connection !== 'connected') && 'Conecte a carteira.',
    stockBlocked && 'Ajuste as quantidades no carrinho.',
    quoteError && !stockBlocked && 'Resolva o problema com os valores do pedido.',
    valuesChanged && 'Revise os novos valores do pedido.',
  ].filter((blocker): blocker is string => typeof blocker === 'string')

  /** Salva o formulário da carteira escolhida. Devolve `false` se houver erros. */
  function saveWallet(): Promise<boolean> {
    return new Promise((resolve) => {
      void walletForm.handleSubmit(
        (input) =>
          saveWalletMutation.mutate(
            { slot, input },
            {
              onSuccess: () => {
                announce('Carteira salva.')
                setEditing(null)
                resolve(true)
              },
              onError: (error) => {
                applyApiError(walletForm, error)
                resolve(false)
              },
            },
          ),
        () => resolve(false),
      )()
    })
  }

  function chooseSlot(next: WalletSlot) {
    setSlot(next)
    setEditing(null)
  }

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

  const showFormOnMobile = !wallet || editing === slot

  return (
    <div className="page-container pb-4">
      <nav aria-label="Trilha" className="hidden pt-[30px] pb-6 text-sm font-bold md:block">
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
          <li aria-current="page">Pagamento</li>
        </ol>
      </nav>
      <div className="relative flex items-center justify-center py-4 md:block md:p-0">
        <Link
          to="/carrinho"
          search={{ cupom }}
          aria-label="Voltar para o carrinho"
          className="bg-card hover:text-primary-light absolute left-0 flex size-10 items-center justify-center rounded-full transition-colors md:hidden"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Link>
        <h1 className="text-lg font-bold md:sr-only">Pagamento com carteira</h1>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[minmax(0,1fr)_340px] md:items-start md:gap-x-12 md:gap-y-4 xl:grid-cols-[minmax(0,1fr)_405px] xl:gap-x-[72px]">
        <div className="flex flex-col gap-6 md:row-span-2">
          <WalletPicker
            wallets={wallets.data}
            selected={slot}
            onSelect={chooseSlot}
            editing={editing}
            onEdit={(next) => {
              setSlot(next)
              setEditing((current) => (current === next ? null : next))
            }}
            className="md:hidden"
          />

          {/* No mobile os dados só aparecem para cadastrar ou editar, pelo menu do cartão. */}
          <section aria-labelledby="wallet-data-title" className={cn(!showFormOnMobile && 'max-md:hidden')}>
            <h2 id="wallet-data-title" className="mb-4 text-lg font-bold">
              <span className="md:hidden">Dados da carteira {slotNames[slot].toLowerCase()}</span>
              <span className="hidden md:inline">Perfil do colecionador</span>
            </h2>
            <WalletFields form={walletForm} />
            <label className="mt-5 hidden w-fit cursor-pointer items-center gap-2 text-[15px] md:flex">
              <input
                type="checkbox"
                checked={slot === 'secondary'}
                onChange={(event) => chooseSlot(event.target.checked ? 'secondary' : 'primary')}
                className="border-primary checked:bg-primary size-4 cursor-pointer appearance-none rounded-full border-2 checked:shadow-[inset_0_0_0_2px_var(--color-background)]"
              />
              Usar outra carteira?
              {wallets.data.secondary && (
                <span className="text-text-secondary text-sm">({wallets.data.secondary.nickname})</span>
              )}
            </label>
          </section>

          <div className="hidden md:block">
            <label htmlFor="collector-note" className="mb-2 block text-[15px]">
              Observação do colecionador (opcional)
            </label>
            <textarea
              id="collector-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={280}
              rows={5}
              className="bg-card focus-visible:border-primary w-full max-w-[370px] rounded-sm border p-3 text-sm"
            />
          </div>
        </div>

        <section aria-labelledby="order-summary-title" className="flex flex-col gap-4">
          <WalletConnection
            slot={slot}
            wallet={wallet}
            provider={provider}
            onProviderChange={(next) =>
              walletForm.setValue('provider', next, {
                shouldDirty: true,
                shouldValidate: walletForm.formState.isSubmitted,
              })
            }
            saveFirst={unsaved ? saveWallet : null}
            className="max-md:order-1 md:order-last md:mt-2"
          />

          {quote.data && (
            <p className="flex items-baseline justify-end gap-6 text-lg font-bold max-md:order-2 md:hidden" aria-hidden="true">
              Total:
              <span className="text-text-accent text-xl">{formatEth(quote.data.total)}</span>
            </p>
          )}

          <div className="flex flex-col gap-4 max-md:order-3 max-md:mt-6">
            <h2 id="order-summary-title" className="text-lg font-bold">
              Seus NFTs
            </h2>
            <div aria-hidden="true" className="-mt-2 flex justify-between border-b pb-2 text-base font-bold">
              <span>NFTs</span>
              <span>Subtotal</span>
            </div>

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
                    className="text-text-accent hover:text-primary-light underline-offset-4 hover:underline"
                  >
                    Aplique aqui
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
          </div>
        </section>

        {/* No mobile, como no layout, a confirmação fica presa à base da tela. */}
        <div className="bg-background sticky bottom-0 z-30 -mx-6 flex flex-col gap-2 px-6 pt-3 pb-5 shadow-[0_-8px_24px_rgb(0_0_0/0.35)] md:static md:col-start-2 md:mx-0 md:bg-transparent md:p-0 md:shadow-none">
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
        </div>
      </div>
    </div>
  )
}
