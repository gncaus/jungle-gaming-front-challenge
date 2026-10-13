import { useHealth } from '@/features/system/hooks/use-health'

const messages = {
  pending: 'API simulada: verificando…',
  success: 'API simulada: conectada',
  error: 'API simulada: indisponível',
} as const

export function ApiStatus() {
  const { status } = useHealth()

  return (
    <p role="status" data-state={status} className="text-muted-foreground text-sm">
      {messages[status]}
    </p>
  )
}
