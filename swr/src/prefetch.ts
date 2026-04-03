import { mutate } from "swr";
import { fetcher } from "./api";

/**
 * Prefetch user data and store it in SWR cache.
 *
 * This allows you to load data *before* a component mounts,
 * improving perceived performance (instant UI on navigation).
 *
 * @param id - User ID to prefetch
 */
export function prefetchUser(id: string) {
    mutate(
        // SWR cache key (must match the one used in useUser)
        ["/api/user", id],

        // Fetch the data and populate the cache
        () => fetcher(`/api/user/${id}`),

        {
            // Do not trigger revalidation immediately after setting cache
            revalidate: false,
        }
    );
}