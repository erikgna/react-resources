import useSWR from "swr"
import { fetcher } from "../api"

export function usePosts(userId?: string) {
  return useSWR(
    // SWR key:
    // - If userId exists → fetch posts for that user
    // - If null → SWR will NOT run the request (conditional fetching)
    userId ? `/api/posts?userId=${userId}` : null,

    // Fetcher function:
    // Responsible for actually making the request (e.g., fetch/axios)
    fetcher
  )
}