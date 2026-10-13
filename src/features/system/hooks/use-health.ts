import { queryOptions, useQuery } from '@tanstack/react-query'
import { getHealth } from '@/features/system/api/get-health'

export const systemKeys = {
  all: ['system'] as const,
  health: () => [...systemKeys.all, 'health'] as const,
}

export const healthQueryOptions = queryOptions({
  queryKey: systemKeys.health(),
  queryFn: ({ signal }) => getHealth(signal),
})

export function useHealth() {
  return useQuery(healthQueryOptions)
}
