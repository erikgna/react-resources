import useSWR from "swr"
import { fetcher } from "../api"
import { logger } from "../logger"

export function usePosts(userId?: string) {
  return useSWR(
    // SWR key:
    // - If userId exists → fetch posts for that user
    // - If null → SWR will NOT run the request (conditional fetching)
    userId ? `/api/posts?userId=${userId}` : null,

    // Fetcher function:
    // Responsible for actually making the request (e.g., fetch/axios)
    fetcher, {
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      // Never retry on 404.
      if (error.status === 404) return
      // Never retry for a specific key.
      if (key === '/api/user') return
      // Only retry up to 10 times.
      if (retryCount >= 10) return
      // Retry after 5 seconds.
      setTimeout(() => revalidate({ retryCount }), 5000)
    },
    use: [logger], // middleware to log the request
  }
  )
}