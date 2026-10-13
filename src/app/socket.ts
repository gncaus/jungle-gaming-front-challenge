import type { Socket } from 'socket.io-client'
import { socketPath } from '@/features/realtime/schemas'
import { backendReady } from '@/shared/lib/backend-ready'

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
 */
export async function connectRealtime(token?: string): Promise<Socket> {
  await backendReady()
  const { io } = await import('socket.io-client')
  return io({
    path: socketPath,
    transports: ['websocket'],
    auth: token ? { token } : {},
  })
}
