import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { queryClient } from '@/app/query-client'
import { RealtimeBridge } from '@/app/realtime'
import { router } from '@/app/router'

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeBridge />
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
