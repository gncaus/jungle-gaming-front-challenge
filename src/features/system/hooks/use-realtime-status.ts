import { useEffect, useState } from 'react'
import { createRealtimeSocket } from '@/app/socket'
import {
  realtimeEventSchema,
  realtimeEventTypes,
  type RealtimeEvent,
} from '@/features/realtime/schemas'

export function useRealtimeStatus() {
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null)

  useEffect(() => {
    const socket = createRealtimeSocket()

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    for (const type of realtimeEventTypes) {
      socket.on(type, (data: unknown) => {
        const event = realtimeEventSchema.safeParse(data)
        if (event.success) setLastEvent(event.data)
      })
    }
    socket.connect()

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [])

  return { connected, lastEvent }
}
