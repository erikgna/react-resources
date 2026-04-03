import useSWR from "swr"
import { fetcher } from "../api"

export function useUser(id?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    // SWR key:
    // - Using an array key allows passing multiple params safely
    // - If `id` is undefined → key is null → request is skipped
    id ? ["/api/user", id] : null,

    // Fetcher function:
    // Receives the key as argument → destructured into [url, id]
    // Then builds the final request URL
    ([url, id]) => fetcher(`${url}/${id}`),

    {
      // Auto re-fetch every 5 seconds (useful for near-real-time data)
      refreshInterval: 5000,

      // Revalidate when user refocuses the window (tab switch, etc.)
      revalidateOnFocus: true,

      // Revalidate when network reconnects
      revalidateOnReconnect: true,

      // Initial fallback data before the first fetch resolves
      fallbackData: [],
    },
  )

  return {
    // Renaming `data` → `user` for better semantic meaning
    user: data,

    // Loading state from SWR
    isLoading,

    // Exposing error (renamed for readability)
    isError: error,

    // mutate:
    // - manually update cache
    // - trigger revalidation
    mutate,
  }
}