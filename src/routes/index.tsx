import { createFileRoute } from '@tanstack/react-router'
import { ApiStatus } from '@/features/system/components/api-status'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <section className="flex flex-col items-start gap-4 py-24">
      <p className="text-sm tracking-widest">Bem-vindo à Kurio</p>
      <h1 className="text-display-sm md:text-display font-bold uppercase">
        Seja dono do futuro da arte digital
      </h1>
      <ApiStatus />
    </section>
  )
}
