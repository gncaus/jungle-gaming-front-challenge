import { useId, useState, type FormEvent, type ReactNode } from 'react'
import type { Cart } from '@/features/cart/schemas'
import { useApplyCoupon, useQuote } from '@/features/checkout/hooks/use-quote'
import type { Quote } from '@/features/checkout/schemas'
import { HttpError } from '@/shared/lib/http'
import { formatEth } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

interface CartSummaryProps {
  cart: Cart
  /** Cupom aplicado, vindo da URL. */
  couponCode: string | null
  onCouponChange: (couponCode: string | null) => void
  /** Ações abaixo do total (continuar comprando, finalizar). */
  actions?: ReactNode
}

const rowClass = 'flex items-baseline justify-between gap-4 text-base'

function Totals({ quote }: { quote: Quote }) {
  return (
    <dl className="flex flex-col gap-3" data-testid="cart-totals">
      <div className={rowClass}>
        <dt>Subtotal</dt>
        <dd className="text-lg">{formatEth(quote.subtotal)}</dd>
      </div>
      <div className={rowClass}>
        <dt>{quote.coupon ? quote.coupon.description : 'Desconto do lançamento'}</dt>
        <dd className="shrink-0 whitespace-nowrap">(-) {formatEth(quote.discount)}</dd>
      </div>
      <div className={rowClass}>
        <dt>Taxa de rede</dt>
        <dd className="text-right text-lg">
          {formatEth(quote.networkFee)}
          <span className="text-text-accent block text-xs">Taxa estimada</span>
        </dd>
      </div>
      <div className={`${rowClass} mt-2 font-bold`}>
        <dt>Total</dt>
        <dd className="text-text-accent text-lg">{formatEth(quote.total)}</dd>
      </div>
    </dl>
  )
}

/** Mesmas linhas e alturas do resumo pronto, para nada se deslocar quando a cotação chega. */
export function TotalsSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" data-testid="cart-totals-skeleton">
      <p role="status" className="sr-only">
        Calculando valores…
      </p>
      <Skeleton className="h-7 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="mt-2 h-7 w-full" />
    </div>
  )
}

/** Resumo do carrinho. Todos os valores vêm da cotação da API. */
export function CartSummary({ cart, couponCode, onCouponChange, actions }: CartSummaryProps) {
  const fieldId = useId()
  const [couponError, setCouponError] = useState('')
  const quote = useQuote(cart, couponCode)
  const applyCoupon = useApplyCoupon(cart)

  function submitCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const code = String(new FormData(form).get('coupon') ?? '').trim()
    if (!code) {
      setCouponError('Informe um código promocional.')
      return
    }
    setCouponError('')
    applyCoupon.mutate(code, {
      onSuccess: (result) => {
        form.reset()
        onCouponChange(result.coupon?.code ?? null)
      },
      onError: (error) => setCouponError(error.message),
    })
  }

  const quoteError = quote.error instanceof HttpError ? quote.error : null
  const couponRejected = quoteError?.code === 'COUPON_INVALID' || quoteError?.code === 'COUPON_EXPIRED'
  const stockBlocked = quoteError?.code === 'INSUFFICIENT_STOCK'

  return (
    <section aria-labelledby={`${fieldId}-title`} className="bg-card rounded-t-[28px] p-6 md:rounded-none md:bg-transparent md:p-0">
      <h2 id={`${fieldId}-title`} className="hidden border-b pb-3 text-lg font-bold md:block">
        Resumo da carteira
      </h2>

      <form onSubmit={submitCoupon} noValidate className="md:mt-5">
        <label htmlFor={fieldId} className="mb-2 hidden text-sm font-bold md:block">
          Código promocional
        </label>
        <div className="flex">
          <input
            id={fieldId}
            name="coupon"
            aria-label="Código promocional"
            aria-invalid={couponError ? true : undefined}
            aria-describedby={couponError ? `${fieldId}-error` : undefined}
            placeholder="Digite o código promocional..."
            autoComplete="off"
            maxLength={40}
            className="border-primary bg-background placeholder:text-brand-secondary h-12 min-w-0 flex-1 rounded-l-full border border-r-0 px-4 text-sm uppercase placeholder:normal-case md:h-10 md:rounded-l-sm md:px-2"
          />
          <Button
            type="submit"
            disabled={applyCoupon.isPending}
            className="h-12 rounded-l-none rounded-r-full px-5 text-base md:h-10 md:rounded-r-sm"
          >
            {applyCoupon.isPending ? 'Aplicando…' : 'Aplicar'}
          </Button>
        </div>
        <p id={`${fieldId}-error`} role="alert" className="text-text-coral mt-2 text-sm empty:hidden">
          {couponError}
        </p>
      </form>

      {couponCode && !couponRejected && (
        <p className="mt-3 flex flex-wrap items-center gap-x-3 text-sm">
          <span>
            Cupom <span className="font-bold">{couponCode}</span> aplicado
            {quote.data?.coupon && ` (${quote.data.coupon.percent}% de desconto)`}.
          </span>
          <button
            type="button"
            onClick={() => onCouponChange(null)}
            className="text-text-accent hover:text-primary-light rounded-sm font-bold underline underline-offset-4"
          >
            Remover cupom
          </button>
        </p>
      )}

      <div className="mt-5">
        {quote.isPending && <TotalsSkeleton />}
        {quote.data && <Totals quote={quote.data} />}

        {couponRejected && (
          <div role="alert" className="flex flex-col items-start gap-2 text-sm">
            <p>
              O cupom <span className="font-bold">{couponCode}</span> não pode ser usado: {quoteError.message}
            </p>
            <Button size="sm" variant="outline" onClick={() => onCouponChange(null)}>
              Remover cupom
            </Button>
          </div>
        )}
        {stockBlocked && (
          <p role="alert" className="text-text-coral text-sm">
            Ajuste as quantidades destacadas para calcular o total.
          </p>
        )}
        {quote.error && !couponRejected && !stockBlocked && (
          <div role="alert" className="flex flex-col items-start gap-2 text-sm">
            <p>Não foi possível calcular os valores. {quote.error.message}</p>
            <Button size="sm" variant="outline" onClick={() => void quote.refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}
      </div>

      {actions && <div className="mt-6 flex flex-col items-center gap-4">{actions}</div>}
    </section>
  )
}
