import { useSyncExternalStore } from 'react'
import { currentAnnouncement, subscribeToAnnouncements } from '@/shared/lib/announce'
import { cn } from '@/shared/lib/utils'

/**
 * Região `aria-live` única da aplicação, onde aparecem os avisos de `announce()`.
 * Fica sempre montada, para o leitor de tela perceber quando o texto muda.
 */
export function Announcer() {
  const announcement = useSyncExternalStore(subscribeToAnnouncements, currentAnnouncement)

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="announcer"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-5 md:bottom-6"
    >
      {announcement && (
        <p
          key={announcement.id}
          className={cn(
            'bg-surface-raised overlay-fade max-w-md rounded-lg border px-4 py-3 text-center text-sm shadow-lg',
            announcement.tone === 'error' ? 'border-error text-text-coral' : 'border-primary text-foreground',
          )}
        >
          {announcement.tone === 'error' && <span className="font-bold">Erro: </span>}
          {announcement.message}
        </p>
      )}
    </div>
  )
}
