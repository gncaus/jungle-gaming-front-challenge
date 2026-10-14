import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { networkNames } from '@/features/catalog/labels'
import { OrderItems } from '@/features/checkout/components/order-items'
import type { Order } from '@/features/orders/schemas'
import { providerNames, shortHash } from '@/features/wallets/labels'
import { formatEth } from '@/shared/lib/money'

const explorerNames: Record<Order['receipt']['wallet']['network'], string> = {
  ethereum: 'Etherscan',
  polygon: 'Polygonscan',
  solana: 'Solscan',
}

/** Envelope aberto com "THANK YOU", a ilustração do layout de confirmação. */
function ThankYouEnvelope() {
  return (
    <svg viewBox="0 0 64 72" width="72" height="81" className="text-primary" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <path d="M6 30 L32 8 L58 30" />
        <rect x="14" y="4" width="36" height="30" rx="2" className="fill-card" />
        <path d="M6 30 V66 H58 V30" className="fill-card" />
        <path d="M6 66 L32 44 L58 66" />
        <path d="M6 30 L26 47 M58 30 L38 47" />
      </g>
      <text x="32" y="17" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor">
        THANK
      </text>
      <text x="32" y="27" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor">
        YOU
      </text>
    </svg>
  )
}

const dayMonth = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

/** "14 Out, 2026", o formato curto de data do layout. */
function formatReceiptDate(iso: string): string {
  const date = new Date(iso)
  const parts = dayMonth.formatToParts(date)
  const day = parts.find((part) => part.type === 'day')?.value ?? ''
  const month = (parts.find((part) => part.type === 'month')?.value ?? '').replace('.', '')
  return `${day} ${month.charAt(0).toUpperCase()}${month.slice(1)}, ${date.getFullYear()}`
}

/**
 * Recibo de um pedido confirmado. Tudo o que aparece aqui vem do snapshot guardado no
 * pedido no momento da compra, então mudanças posteriores no catálogo não o alteram.
 */
export function Receipt({ order }: { order: Order }) {
  const { receipt, transaction } = order
  const network = networkNames[receipt.wallet.network]

  return (
    <section
      aria-labelledby="receipt-title"
      className="bg-card border-primary relative mx-auto max-w-[578px] border-b-[10px]"
    >
      <Link
        to="/"
        aria-label="Fechar e voltar ao início"
        className="text-primary hover:text-primary-light absolute top-3 right-3 rounded-sm p-1.5 transition-colors"
      >
        <X className="size-5" aria-hidden="true" />
      </Link>

      <div className="flex flex-col items-center gap-4 px-6 pt-6 pb-5 text-center">
        <ThankYouEnvelope />
        <h1 id="receipt-title" className="text-text-secondary text-base font-bold">
          Seus NFTs agora estão na sua carteira
        </h1>
      </div>

      <dl className="border-primary grid grid-cols-2 gap-x-4 gap-y-3 border-y px-6 py-4 text-sm md:flex md:justify-between md:gap-0 md:px-9">
        <div>
          <dt className="text-text-secondary font-bold">ID da transação</dt>
          <dd className="text-text-secondary" title={transaction?.hash}>
            {transaction ? shortHash(transaction.hash) : '—'}
          </dd>
        </div>
        <div className="md:border-primary md:border-l md:pl-3">
          <dt className="text-text-secondary">Data</dt>
          <dd className="text-text-secondary">{formatReceiptDate(order.updatedAt)}</dd>
        </div>
        <div className="md:border-primary md:border-l md:pl-3">
          <dt className="text-text-secondary">Total</dt>
          <dd className="text-text-secondary">{formatEth(receipt.total)}</dd>
        </div>
        <div className="md:border-primary md:border-l md:pl-3">
          <dt className="text-text-secondary font-bold">Carteira</dt>
          <dd className="text-text-secondary">{providerNames[receipt.wallet.provider]}</dd>
        </div>
      </dl>

      <div className="px-6 py-5 md:px-11">
        <h2 className="mb-3 text-sm font-bold">Detalhes da transação</h2>
        <div aria-hidden="true" className="mb-2 hidden grid-cols-[1fr_auto_88px] gap-6 text-sm font-bold md:grid">
          <span>NFTs</span>
          <span>Edições</span>
          <span className="text-right">Subtotal</span>
        </div>
        <OrderItems items={receipt.items} />

        <dl className="mt-4 ml-auto flex max-w-[320px] flex-col gap-2 border-b pb-3 text-base" data-testid="receipt-totals">
          <div className="flex justify-between gap-4">
            <dt>Subtotal</dt>
            <dd>{formatEth(receipt.subtotal)}</dd>
          </div>
          {receipt.coupon && (
            <div className="flex justify-between gap-4">
              <dt>{receipt.coupon.description}</dt>
              <dd className="whitespace-nowrap">(-) {formatEth(receipt.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt>Taxa de rede</dt>
            <dd>{formatEth(receipt.networkFee)}</dd>
          </div>
          <div className="flex justify-between gap-4 font-bold">
            <dt>Total</dt>
            <dd className="text-text-accent">{formatEth(receipt.total)}</dd>
          </div>
        </dl>

        <p className="text-text-secondary mt-4 text-center text-sm leading-[22px]">
          Transação confirmada na {network}. A propriedade foi transferida para sua carteira conectada e
          registrada na rede.
        </p>

        <div className="mt-5 flex flex-col items-center gap-2 pb-4">
          {transaction && (
            <>
              <a
                href={transaction.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-primary text-primary-foreground hover:bg-primary-light flex h-12 items-center rounded-sm px-4 text-base font-bold transition-colors"
              >
                Ver no {explorerNames[receipt.wallet.network]}
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
              <p className="text-text-secondary text-xs">
                Transação e link simulados: o explorador não vai encontrá-la.
              </p>
            </>
          )}
          <Link to="/" hash="catalogo" className="text-text-accent hover:text-primary-light mt-2 text-sm transition-colors">
            Continuar explorando
          </Link>
        </div>
      </div>
    </section>
  )
}
