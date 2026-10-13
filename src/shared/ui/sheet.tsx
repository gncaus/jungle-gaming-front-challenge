import type * as React from 'react'
import { XIcon } from 'lucide-react'
import { Dialog as SheetPrimitive } from 'radix-ui'
import { cn } from '@/shared/lib/utils'

function Sheet(props: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger(props: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose(props: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetContent({
  className,
  children,
  side = 'right',
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'right' | 'left' | 'bottom'
}) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay data-slot="sheet-overlay" className="overlay-fade fixed inset-0 z-50 bg-black/60" />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          'sheet-slide bg-background fixed z-50 flex flex-col gap-4 overflow-y-auto shadow-lg',
          side === 'right' && 'inset-y-0 right-0 h-full w-[85%] max-w-sm border-l',
          side === 'left' && 'inset-y-0 left-0 h-full w-[85%] max-w-sm border-r',
          side === 'bottom' && 'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl border-t',
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="text-foreground hover:text-primary absolute top-4 right-4 rounded-sm p-1 transition-colors">
          <XIcon className="size-5" aria-hidden="true" />
          <span className="sr-only">Fechar</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="sheet-header" className={cn('flex flex-col gap-1.5 p-5 pr-12', className)} {...props} />
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('text-foreground text-lg font-bold', className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription }
