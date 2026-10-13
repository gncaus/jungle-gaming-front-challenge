import Decimal from 'decimal.js'
import { useState } from 'react'
import { formatEthNumber, type EthAmount } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Slider } from '@/shared/ui/slider'

/** O slider trabalha em centésimos de ETH, como inteiros; o valor em ETH continua sendo texto. */
const stepsPerEth = 100

function toSteps(amount: EthAmount, round: 'floor' | 'ceil'): number {
  return new Decimal(amount).times(stepsPerEth)[round]().toNumber()
}

function toAmount(steps: number): EthAmount {
  return new Decimal(steps).div(stepsPerEth).toFixed()
}

interface PriceRangeProps {
  /** Menor e maior preço do catálogo. */
  bounds: { min: EthAmount; max: EthAmount }
  /** Faixa aplicada na URL; `undefined` significa sem limite daquele lado. */
  applied: { min?: EthAmount; max?: EthAmount }
  onApply: (range: { min?: EthAmount; max?: EthAmount }) => void
}

export function PriceRange({ bounds, applied, onApply }: PriceRangeProps) {
  const lowest = toSteps(bounds.min, 'floor')
  const highest = toSteps(bounds.max, 'ceil')
  const appliedRange = [
    applied.min ? toSteps(applied.min, 'floor') : lowest,
    applied.max ? toSteps(applied.max, 'ceil') : highest,
  ]

  // O rascunho só existe enquanto o usuário arrasta; sem ele, o slider mostra o que está aplicado.
  const [draft, setDraft] = useState<number[] | null>(null)
  const [from = lowest, to = highest] = draft ?? appliedRange

  function apply() {
    onApply({
      min: from > lowest ? toAmount(from) : undefined,
      max: to < highest ? toAmount(to) : undefined,
    })
    setDraft(null)
  }

  return (
    <div>
      <Slider
        min={lowest}
        max={highest}
        step={1}
        minStepsBetweenThumbs={1}
        value={[from, to]}
        onValueChange={setDraft}
        thumbLabels={['Preço mínimo', 'Preço máximo']}
        formatValue={(steps) => `${formatEthNumber(toAmount(steps), ',')} ETH`}
        disabled={highest <= lowest}
      />
      <p className="mt-3 pl-3 text-sm">
        Preço: {formatEthNumber(toAmount(from), ',')} – {formatEthNumber(toAmount(to), ',')} ETH
      </p>
      <Button size="sm" className="mt-3 ml-3 text-sm" onClick={apply}>
        Aplicar
      </Button>
    </div>
  )
}
