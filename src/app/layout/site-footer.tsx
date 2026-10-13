import { Link } from '@tanstack/react-router'
import { NewsletterForm } from '@/app/layout/newsletter-form'
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
  YoutubeIcon,
} from '@/shared/ui/brand-icons'

const pillars = [
  {
    initial: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    initial: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    initial: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

/** Seções fora do escopo da entrega: aparecem como texto, não como links que levariam a lugar nenhum. */
const profileItems = ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse']
const helpItems = [
  'Central de ajuda',
  'Como comprar NFTs',
  'Carteira e segurança',
  'Política do mercado',
  'Denunciar item',
]

const collectionLinks = [
  { id: 'arte-digital', name: 'Arte digital' },
  { id: 'fotografia', name: 'Fotografia' },
  { id: 'musica', name: 'Música' },
  { id: 'arte-3d', name: 'Arte 3D' },
  { id: 'utilidade', name: 'Utilidade' },
]

const socialNetworks = [
  { name: 'Facebook', Icon: FacebookIcon },
  { name: 'Instagram', Icon: InstagramIcon },
  { name: 'Twitter', Icon: TwitterIcon },
  { name: 'LinkedIn', Icon: LinkedinIcon },
  { name: 'YouTube', Icon: YoutubeIcon },
]

const wallets = ['MetaMask', 'WalletConnect', 'Coinbase']

function TextColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-lg font-bold">{title}</h3>
      <ul className="mt-2 flex flex-col gap-2 text-sm leading-[22px]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="page-container mt-20 pb-24 md:pb-6 xl:mt-[146px]">
      <div className="bg-card">
        <div className="grid gap-8 p-6 md:grid-cols-2 xl:grid-cols-[297px_266px_265px_1fr] xl:gap-0 xl:px-0 xl:pt-8 xl:pb-4">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="xl:border-primary xl:border-r xl:pl-[17px] xl:first:pl-12">
              <span
                aria-hidden="true"
                className="bg-primary text-primary-foreground flex size-[74px] items-center justify-center rounded-full text-2xl font-bold"
              >
                {pillar.initial}
              </span>
              <h3 className="mt-5 text-[17px] font-bold">{pillar.title}</h3>
              <p className="text-text-secondary mt-2 max-w-[220px] text-sm leading-[22px]">{pillar.text}</p>
            </div>
          ))}
          <div className="xl:pr-[30px] xl:pl-[17px]">
            <NewsletterForm />
          </div>
        </div>

        <div className="bg-surface-dark grid grid-cols-2 items-center gap-4 px-6 py-6 text-sm md:grid-cols-4 xl:min-h-[88px] xl:grid-cols-[303px_302px_303px_1fr] xl:gap-0 xl:px-8 xl:py-0">
          <p className="font-bold tracking-widest">KURIO</p>
          <p className="leading-[22px]">Feito para colecionadores, criadores e cultura</p>
          <p>contato@email.com</p>
          <p>+55 11 4002 8922</p>
        </div>

        <div className="grid grid-cols-2 gap-8 px-6 py-8 md:grid-cols-4 xl:grid-cols-[303px_302px_303px_1fr] xl:gap-0 xl:px-8">
          <TextColumn title="Meu perfil" items={profileItems} />
          <TextColumn title="Central de ajuda" items={helpItems} />
          <nav aria-labelledby="footer-collections">
            <h3 id="footer-collections" className="text-lg font-bold">
              Coleções
            </h3>
            <ul className="mt-2 flex flex-col gap-2 text-sm leading-[22px]">
              {collectionLinks.map((collection) => (
                <li key={collection.id}>
                  <Link
                    to="/"
                    search={{ collection: [collection.id], page: 1 }}
                    hash="catalogo"
                    className="hover:text-primary-light transition-colors"
                  >
                    {collection.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <h3 className="text-lg font-bold">Redes sociais</h3>
            <ul className="mt-3 flex gap-2">
              {socialNetworks.map(({ name, Icon }) => (
                <li
                  key={name}
                  className="border-primary text-primary flex size-8 items-center justify-center rounded-sm border"
                >
                  <Icon className="size-5" />
                  <span className="sr-only">{name}</span>
                </li>
              ))}
            </ul>
            <h3 className="mt-7 text-lg font-bold">Carteiras compatíveis</h3>
            <ul className="border-border-soft bg-surface-dark text-text-accent mt-3 inline-flex flex-wrap gap-x-3 rounded-sm border px-2.5 py-1.5 text-[9px] font-bold tracking-wider uppercase">
              {wallets.map((wallet, index) => (
                <li key={wallet} className="flex gap-x-3">
                  {index > 0 && <span aria-hidden="true">·</span>}
                  {wallet}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-sm">
        <span aria-hidden="true">©</span> 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}
