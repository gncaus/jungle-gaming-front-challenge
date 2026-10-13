import { createFileRoute } from '@tanstack/react-router'
import { useProfile } from '@/features/profile/hooks/use-profile'
import { WalletSection } from '@/features/wallets/components/wallet-section'
import { useWallets } from '@/features/wallets/hooks/use-wallets'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

export const Route = createFileRoute('/perfil/carteiras')({
  component: WalletsPage,
})

function WalletsPage() {
  const wallets = useWallets()
  const profile = useProfile()
  // As sugestões do formulário vêm do perfil, então a tela espera as duas consultas.
  const isPending = wallets.isPending || profile.isPending
  const suggestions = {
    displayName: profile.data?.displayName ?? '',
    nickname: profile.data?.walletNickname ?? '',
    email: profile.data?.email ?? '',
    ensName: profile.data?.ensName ?? '',
  }

  return (
    <section aria-labelledby="wallets-title">
      <h1 id="wallets-title" className="text-base font-bold">
        Carteiras
      </h1>
      <p className="text-text-secondary mt-1 mb-6 text-sm">
        Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
      </p>

      {isPending && (
        <div className="flex flex-col gap-4" aria-busy="true">
          <p role="status" className="sr-only">
            Carregando carteiras…
          </p>
          <Skeleton className="h-[190px]" />
          <Skeleton className="h-[60px]" />
        </div>
      )}

      {wallets.error && !wallets.data && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-sm">Não foi possível carregar as carteiras. {wallets.error.message}</p>
          <Button variant="outline" onClick={() => void wallets.refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {!isPending && wallets.data && (
        <div className="flex flex-col gap-10">
          <WalletSection slot="primary" wallet={wallets.data.primary} suggestions={suggestions} />
          <WalletSection
            slot="secondary"
            wallet={wallets.data.secondary}
            suggestions={suggestions}
            copyFrom={wallets.data.primary}
          />
        </div>
      )}
    </section>
  )
}
