export function logger(useSWRNext: any) {
    return (key: any, fetcher: any, config: any) => {
        // Add logger to the original fetcher.
        const extendedFetcher = (...args: any[]) => {
            console.log('SWR Request:', key)
            return fetcher(...args)
        }
        // Execute the hook with the new fetcher.
        return useSWRNext(key, extendedFetcher, config)
    }
}