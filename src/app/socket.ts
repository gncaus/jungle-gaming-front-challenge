import { io, type Socket } from 'socket.io-client'
import { socketPath } from '@/features/realtime/schemas'

/**
 * Cria a conexão Socket.IO com a mesma origem da aplicação, ainda desconectada.
 * Só o transporte WebSocket é usado: a simulação com MSW intercepta WebSocket,
 * mas não o long-polling com que o Socket.IO começaria por padrão.
 */
export function createRealtimeSocket(token?: string): Socket {
  return io({
    path: socketPath,
    transports: ['websocket'],
    auth: token ? { token } : {},
    autoConnect: false,
  })
}
