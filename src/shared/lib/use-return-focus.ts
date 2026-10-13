import { useState } from 'react'

/**
 * Para diálogos montados sob demanda, sem um gatilho que o Radix conheça: guarda quem tinha
 * o foco quando o diálogo foi montado e devolve o foco a ele no fechamento.
 * Use o retorno em `onCloseAutoFocus`.
 */
export function useReturnFocus(): (event: Event) => void {
  // `useState` com inicializador roda uma vez, na montagem, antes de o diálogo roubar o foco.
  const [opener] = useState(() => document.activeElement)

  return (event) => {
    event.preventDefault()
    const target = opener instanceof HTMLElement && opener.isConnected ? opener : document.getElementById('conteudo')
    target?.focus()
  }
}
