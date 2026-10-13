import { useState, type FormEvent } from 'react'

/**
 * A inscrição por e-mail está fora do escopo da entrega e não tem API.
 * O formulário existe no layout, mas responde com um aviso em vez de simular sucesso.
 */
export function NewsletterForm() {
  const [notice, setNotice] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(true)
  }

  return (
    <form onSubmit={submit} noValidate>
      <h3 className="text-lg leading-4 font-bold">Antecipe-se ao próximo lançamento</h3>
      <div className="mt-4 flex">
        <label htmlFor="newsletter-email" className="sr-only">
          Seu e-mail
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="digite seu e-mail..."
          aria-describedby="newsletter-help"
          className="bg-surface-dark placeholder:text-brand-secondary h-10 min-w-0 flex-1 rounded-l-sm px-3 text-sm"
        />
        <button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-primary-light h-10 rounded-r-sm px-4 text-lg font-bold transition-colors"
        >
          Enviar
        </button>
      </div>
      <p id="newsletter-help" className="text-text-secondary mt-4 text-xs leading-[22px]">
        Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
      </p>
      <p role="status" className="text-text-accent mt-2 text-xs">
        {notice && 'A inscrição por e-mail não está disponível nesta demonstração.'}
      </p>
    </form>
  )
}
