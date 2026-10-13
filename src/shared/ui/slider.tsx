import type * as React from 'react'
import { Slider as SliderPrimitive } from 'radix-ui'
import { cn } from '@/shared/lib/utils'

/** Slider de intervalo. `thumbLabels` nomeia cada alça e `formatValue` descreve seu valor para leitores de tela. */
function Slider({
  className,
  value,
  thumbLabels,
  formatValue,
  ...props
}: Omit<React.ComponentProps<typeof SliderPrimitive.Root>, 'value' | 'defaultValue'> & {
  value: number[]
  thumbLabels: string[]
  formatValue: (value: number) => string
}) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      value={value}
      className={cn(
        'relative flex h-5 w-full touch-none items-center select-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="bg-border-soft relative h-[3px] w-full grow overflow-hidden rounded-full"
      >
        <SliderPrimitive.Range data-slot="slider-range" className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>
      {value.map((thumbValue, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          aria-label={thumbLabels[index]}
          aria-valuetext={formatValue(thumbValue)}
          className="border-ink bg-primary hover:bg-primary-light block size-5 shrink-0 rounded-full border-[3px] transition-colors"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
