import { ReactNode } from 'react'
import { SWRConfig } from 'swr'

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 2000,
      }}
    >
      {children}
    </SWRConfig>
  )
}
