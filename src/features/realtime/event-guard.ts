import type { RealtimeEvent } from '@/features/realtime/schemas'

const rememberedEvents = 500

/**
 * Decide se um evento em tempo real deve ser aplicado.
 *
 * Um evento é descartado quando:
 * - o seu `id` já foi visto (entrega duplicada), ou
 * - a sua `version` é menor ou igual à mais recente conhecida do recurso (evento antigo,
 *   entregue fora de ordem ou depois de o estado já ter chegado por outro caminho).
 *
 * Assim o estado nunca regride e nenhum efeito (aviso, nova consulta) acontece duas vezes.
 * Cada conexão de socket tem o seu guarda, então nada do usuário anterior é lembrado.
 */
export function createEventGuard() {
  const seenIds = new Set<string>()
  const appliedVersions = new Map<string, number>()

  return {
    /**
     * @param knownVersion versão do recurso que o cliente já tem por outro caminho
     *   (por exemplo, a que veio da API REST), se houver.
     */
    accept(event: RealtimeEvent, knownVersion = 0): boolean {
      const resource = `${event.resource}:${event.resourceId}`
      const current = Math.max(appliedVersions.get(resource) ?? 0, knownVersion)
      if (seenIds.has(event.id) || event.version <= current) {
        return false
      }

      seenIds.add(event.id)
      appliedVersions.set(resource, event.version)
      if (seenIds.size > rememberedEvents) {
        // Os ids mais antigos saem; as versões aplicadas continuam barrando eventos velhos.
        const oldest = seenIds.values().next().value
        if (oldest !== undefined) seenIds.delete(oldest)
      }
      return true
    },
  }
}
