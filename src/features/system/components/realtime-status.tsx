import { useRealtimeStatus } from '@/features/system/hooks/use-realtime-status'

export function RealtimeStatus() {
  const { connected, lastEvent } = useRealtimeStatus()

  return (
    <div aria-live="polite" className="text-muted-foreground text-sm">
      <p data-state={connected ? 'connected' : 'disconnected'}>
        Tempo real: {connected ? 'conectado' : 'desconectado'}
      </p>
      {lastEvent && (
        <p>
          Último evento: {lastEvent.type} · {lastEvent.resourceId} · versão {lastEvent.version}
        </p>
      )}
    </div>
  )
}
