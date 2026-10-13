import { http } from '@/shared/lib/http'
import { healthSchema, type Health } from '@/features/system/schemas'

export async function getHealth(signal?: AbortSignal): Promise<Health> {
  const { data } = await http.get<unknown>('/health', { signal })
  return healthSchema.parse(data)
}
