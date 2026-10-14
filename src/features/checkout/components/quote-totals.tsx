import type { Quote } from '@/features/checkout/schemas'
import { formatEth } from '@/shared/lib/money'
import { Skeleton } from '@/shared/ui/skeleton'

const rowClass = 'flex items-baseline justify-between gap-4 text-[15px]'

/** Subtotal, desconto, taxa de rede e total, exatamente como vieram da cotação. */
export function QuoteTotals({ quote }: { quote: Quote }) {
  return (
    <dl className="flex flex-col gap-3" data-testid="cart-totals">
      <div className={rowClass}>
        <dt>Subtotal</dt>
        <dd className="md:text-lg">{formatEth(quote.subtotal)}</dd>
      </div>
      <div className={rowClass}>
        <dt className={quote.coupon ? undefined : 'whitespace-nowrap'}>
          {quote.coupon ? quote.coupon.description : 'Desconto do lançamento'}
        </dt>
        <dd className="shrink-0 whitespace-nowrap">(-) {formatEth(quote.discount)}</dd>
      </div>
      <div className={rowClass}>
        <dt>Taxa de rede</dt>
        <dd className="text-right md:text-lg">
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
export function QuoteTotalsSkeleton() {
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
