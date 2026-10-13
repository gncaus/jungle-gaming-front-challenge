interface Article {
  date: string
  readingTime: string
  title: string
  summary: string
  image: string
}

/** Conteúdo editorial do layout. As páginas dos artigos estão fora do escopo da entrega. */
const articles: Article[] = [
  {
    date: '12 de setembro',
    readingTime: 'Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    summary: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: '/images/nfts/neon-vessel-full-640.webp',
  },
  {
    date: '13 de setembro',
    readingTime: 'Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    summary: 'Conheça criadores que moldam a cultura digital.',
    image: '/images/nfts/emerald-ape-full-640.webp',
  },
  {
    date: '15 de setembro',
    readingTime: 'Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    summary: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: '/images/nfts/sage-nomad-full-640.webp',
  },
  {
    date: '15 de setembro',
    readingTime: 'Leitura de 2 min',
    title: 'Como proteger sua carteira',
    summary: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: '/images/nfts/golden-beat-full-640.webp',
  },
]

export function Journal() {
  return (
    <section aria-labelledby="journal-title">
      <h2 id="journal-title" className="text-heading-sm xl:text-heading-lg text-center font-bold">
        Diário da Cunhagem
      </h2>
      <p className="text-text-secondary mt-3 text-center text-sm">
        Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
      </p>
      <ul className="mt-9 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {articles.map((article) => (
          <li key={article.title} className="bg-card overflow-hidden rounded-lg">
            <img
              // `loading` antes de `src`: ver o comentário em nft-image.tsx.
              loading="lazy"
              decoding="async"
              src={article.image}
              alt=""
              width={640}
              height={640}
              className="aspect-[268/195] w-full object-cover object-top"
            />
            <div className="flex flex-col gap-2 p-4">
              <p className="text-text-secondary text-[11px]">
                {article.date} <span aria-hidden="true">|</span> {article.readingTime}
              </p>
              <h3 className="text-base leading-[21px] font-bold">{article.title}</h3>
              <p className="text-text-secondary text-xs leading-4">{article.summary}</p>
              <p className="text-brand-secondary text-xs font-bold">Artigo disponível em breve</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
