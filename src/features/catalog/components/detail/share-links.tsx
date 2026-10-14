import { Mail } from 'lucide-react'
import type { NftDetail } from '@/features/catalog/schemas'
import { LinkedinIcon, TwitterIcon } from '@/shared/ui/brand-icons'

const linkClass =
  'text-foreground hover:text-primary-light flex size-8 items-center justify-center rounded-sm transition-colors'

/** "Compartilhar este NFT": abre o compartilhamento de cada rede com o endereço da página. */
export function ShareLinks({ nft }: { nft: Pick<NftDetail, 'id' | 'name'> }) {
  const url = `${window.location.origin}/nft/${nft.id}`
  const text = `${nft.name} no Kurio`
  const targets = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: <LinkedinIcon className="size-4" />,
    },
    {
      label: 'e-mail',
      href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
      icon: <Mail className="size-4" aria-hidden="true" />,
    },
    {
      label: 'Twitter',
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      icon: <TwitterIcon className="size-4" />,
    },
  ]

  return (
    <div className="mt-1 flex items-center gap-1">
      <p className="mr-1 text-[15px] font-bold">Compartilhar este NFT:</p>
      {targets.map((target) => (
        <a
          key={target.label}
          href={target.href}
          target={target.label === 'e-mail' ? undefined : '_blank'}
          rel="noopener noreferrer"
          aria-label={`Compartilhar por ${target.label}`}
          className={linkClass}
        >
          {target.icon}
        </a>
      ))}
    </div>
  )
}
