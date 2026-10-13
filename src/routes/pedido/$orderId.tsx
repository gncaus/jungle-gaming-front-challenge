import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useSession } from '@/features/auth/hooks/use-session'
import { requireSession } from '@/features/auth/search'
import { cartKeys } from '@/features/cart/hooks/use-cart'
import { OrderItems } from '@/features/checkout/components/order-items'
import { quoteKeys } from '@/features/checkout/hooks/use-quote'
import { finishPurchaseAttempt } from '@/features/orders/attempt'
import { Receipt } from '@/features/orders/components/receipt'
import { useOrder } from '@/features/orders/hooks/use-orders'
import type { Order } from '@/features/orders/schemas'
import { HttpError } from '@/shared/lib/http'
import { formatEth } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

export const Route = createFileRoute('/pedido/$orderId')({
  staticData: { requiresAuth: true },
  beforeLoad: requireSession,
  component: OrderPage,
})

function OrderPage() {
  const { orderId } = Route.useParams()
  const { user } = useSession()
  const queryClient = useQueryClient()
  const { data: order, error, isPending, refetch } = useOrder(orderId)
  const status = order?.status

  // Quando o pedido chega a um estado final, a tentativa de compra termina e o carrinho
  // (que perde os itens comprados na confirmação) é consultado de novo.
  useEffect(() => {
    if (!user || !status || status === 'pending') return
    finishPurchaseAttempt(user.id)
    void queryClient.invalidateQueries({ queryKey: cartKeys.detail(user.id) })
    void queryClient.invalidateQueries({ queryKey: quoteKeys.all(user.id) })
  }, [status, user, queryClient])

  if (isPending) {
    return (
      <div className="page-container flex min-h-dvh flex-col items-center gap-4 py-16" aria-busy="true">
        <p role="status" className="sr-only">
          Carregando pedido…
        </p>
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="h-7 w-80 max-w-full" />
        <Skeleton className="h-64 w-full max-w-[578px]" />
      </div>
    )
  }

  if (error) {
    const code = error instanceof HttpError ? error.code : null
    const title =
      code === 'NOT_FOUND'
        ? 'Pedido não encontrado'
        : code === 'FORBIDDEN'
          ? 'Este pedido pertence a outra conta'
          : 'Não foi possível carregar o pedido'
    return (
      <section role="alert" className="page-container flex flex-col items-start gap-4 py-24">
        <h1 className="text-heading-lg font-bold">{title}</h1>
        {!code || code === 'NETWORK_ERROR' || code === 'INTERNAL_ERROR' ? (
          <>
            <p className="text-muted-foreground text-sm">{error.message}</p>
            <Button onClick={() => void refetch()}>Tentar novamente</Button>
          </>
        ) : (
          <Button asChild>
            <Link to="/">Voltar ao início</Link>
          </Button>
        )}
      </section>
    )
  }

  return (
    <div className="page-container py-10 md:py-16">
      {order.status === 'confirmed' && <Receipt order={order} />}
      {order.status === 'pending' && <PendingOrder order={order} />}
      {order.status === 'declined' && <DeclinedOrder order={order} />}
    </div>
  )
}

function PendingOrder({ order }: { order: Order }) {
  return (
    <section aria-labelledby="order-title" className="bg-card mx-auto flex max-w-[578px] flex-col gap-4 p-6 md:p-10">
      <h1 id="order-title" className="text-heading-sm font-bold">
        Processando seu pagamento
      </h1>
      <p role="status" className="text-text-secondary text-sm leading-6">
        Aguardando a confirmação da carteira. Pode recarregar ou fechar esta página: o pedido {order.id}{' '}
        continua em andamento e não será duplicado.
      </p>
      <Skeleton className="h-2 w-full rounded-full" />
      <OrderItems items={order.receipt.items} />
      <p className="flex justify-between text-base font-bold">
        <span>Total</span>
        <span className="text-text-accent">{formatEth(order.receipt.total)}</span>
      </p>
    </section>
  )
}

function DeclinedOrder({ order }: { order: Order }) {
  return (
    <section
      aria-labelledby="order-title"
      className="bg-card border-error mx-auto flex max-w-[578px] flex-col items-start gap-4 border-b-[10px] p-6 md:p-10"
    >
      <h1 id="order-title" className="text-heading-sm font-bold">
        Pagamento recusado
      </h1>
      <p role="alert" className="text-sm leading-6">
        {order.declineReason ?? 'O pagamento não foi concluído.'} Nada foi cobrado, e os itens continuam no
        seu carrinho.
      </p>
      <OrderItems items={order.receipt.items} />
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/pagamento">Tentar novamente</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/carrinho">Voltar ao carrinho</Link>
        </Button>
      </div>
    </section>
  )
}
