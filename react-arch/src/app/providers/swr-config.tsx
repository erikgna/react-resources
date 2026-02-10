import type { ReactNode } from 'react'
import { SWRConfig } from 'swr'

// Centralized SWR configuration
export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        // Prevent refetching data when the browser window regains focus
        revalidateOnFocus: false,

        // Prevent refetching when the network reconnects
        revalidateOnReconnect: false,

        // Time interval during which identical requests are deduplicated to avoid duplicate fetches
        dedupingInterval: 2000,
      }}
    >
      {children}
    </SWRConfig>
  )
}
