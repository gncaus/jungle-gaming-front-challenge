import type { Socket } from 'socket.io-client'
import { socketPath } from '@/features/realtime/schemas'
import { backendReady } from '@/shared/lib/backend-ready'

const firstConnectionDelayMs = 1500
let isFirstConnection = true

/**
 * Abre a conexão Socket.IO com a mesma origem da aplicação.
 *
 * O `socket.io-client` é importado aqui, sob demanda e só depois de a API simulada
 * estar pronta: ele guarda a referência ao `WebSocket` do navegador no momento em que
 * é carregado, e o MSW só consegue interceptar a conexão se já tiver substituído esse
 * `WebSocket` antes. Carregar sob demanda também tira a biblioteca do bundle inicial.
 *
 * Só o transporte WebSocket é usado, porque o MSW não intercepta o long-polling com
 * que o Socket.IO começaria por padrão.
 *
 * A primeira conexão da página espera um instante: a biblioteca e o handshake não são
 * necessários para a primeira tela e disputariam rede e processamento com ela. O que mudar
 * nesse intervalo é coberto pela reconciliação via REST que acontece a cada conexão.
 */
export async function connectRealtime(token?: string): Promise<Socket> {
  await backendReady()
  if (isFirstConnection) {
    isFirstConnection = false
    await new Promise((resolve) => setTimeout(resolve, firstConnectionDelayMs))
  }
  const { io } = await import('socket.io-client')
  return io({
    path: socketPath,
    transports: ['websocket'],
    auth: token ? { token } : {},
  })
}
