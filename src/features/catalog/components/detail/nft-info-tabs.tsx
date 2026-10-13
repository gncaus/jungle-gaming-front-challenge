import { Tabs } from 'radix-ui'
import { NftRating } from '@/features/catalog/components/detail/nft-rating'
import type { NftDetail } from '@/features/catalog/schemas'

const networkNames: Record<NftDetail['network'], string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

const triggerClass =
  'data-[state=active]:border-primary data-[state=active]:text-text-accent hover:text-primary-light -mb-px border-b-2 border-transparent pb-2 text-left text-[15px] transition-colors data-[state=active]:font-bold md:text-[17px]'

export function NftInfoTabs({ nft }: { nft: NftDetail }) {
  const network = networkNames[nft.network]

  return (
    <Tabs.Root defaultValue="details">
      <Tabs.List aria-label="Informações do NFT" className="flex gap-6 border-b md:gap-10">
        <Tabs.Trigger value="details" className={triggerClass}>
          Detalhes do NFT
        </Tabs.Trigger>
        <Tabs.Trigger value="reviews" className={triggerClass}>
          Avaliações de colecionadores ({nft.rating.count})
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="details" className="text-text-secondary pt-4 text-sm leading-6">
        {nft.story.map((paragraph) => (
          <p key={paragraph} className="mb-6">
            {paragraph}
          </p>
        ))}
        <dl className="flex flex-col gap-3">
          <div>
            <dt className="text-foreground font-bold">Rede:</dt>
            <dd>Cunhado na {network} com procedência imutável e metadados armazenados no IPFS.</dd>
          </div>
          <div>
            <dt className="text-foreground font-bold">Direitos autorais:</dt>
            <dd>
              Direitos autorais de {nft.creator.name}: {nft.creator.royaltyPercent}% nas vendas secundárias,
              pagos automaticamente pelos mercados compatíveis.
            </dd>
          </div>
          <div>
            <dt className="text-foreground font-bold">Contrato:</dt>
            <dd>
              {nft.contract.address} • Contrato inteligente {nft.contract.standard} verificado.
            </dd>
          </div>
        </dl>
      </Tabs.Content>

      <Tabs.Content value="reviews" className="pt-4">
        <NftRating rating={nft.rating} />
        <p className="text-text-secondary mt-3 text-sm leading-6">
          Os comentários dos colecionadores ainda não estão disponíveis nesta demonstração; a nota acima
          resume as avaliações recebidas.
        </p>
      </Tabs.Content>
    </Tabs.Root>
  )
}
