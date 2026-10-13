import type * as React from 'react'
import { XIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { cn } from '@/shared/lib/utils'

function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

/**
 * Conteúdo do diálogo: centralizado em telas largas e ocupando a tela toda no mobile,
 * como nos frames de login e cadastro. O Radix prende o foco aqui e o devolve ao fechar.
 */
function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay data-slot="dialog-overlay" className="overlay-fade fixed inset-0 z-50 bg-black/60" />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'overlay-fade bg-background md:bg-card fixed inset-0 z-50 overflow-y-auto md:inset-auto md:top-1/2 md:left-1/2 md:max-h-[calc(100dvh-2rem)] md:w-[500px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-sm',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="text-primary hover:text-primary-light absolute top-3 right-3 rounded-sm p-1.5 transition-colors">
          <XIcon className="size-5" aria-hidden="true" />
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn('font-bold', className)} {...props} />
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-[13px] leading-4', className)}
      {...props}
    />
  )
}

export { Dialog, DialogContent, DialogTitle, DialogDescription }
