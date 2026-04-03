import useSWRMutation from "swr/mutation"

/**
 * @returns An object with:
 *  - trigger: function to execute the mutation
 *  - data: response data from the mutation
 *  - error: error if the mutation fails
 *  - isMutating: boolean indicating loading state
 */
export function useUpdateUser() {
    return useSWRMutation(
        "/api/user",
        /**
         * Mutation function
         *
         * @param url - The key passed above ("/api/user")
         * @param options.arg - Data passed when calling `trigger(arg)`
         */
        async (url, { arg }: { arg: { name: string } }) => {
            await new Promise((r) => setTimeout(r, 1000))

            // Normally do something like:
            // return fetch(url, { method: "PUT", body: JSON.stringify(arg) })

            return {
                name: arg.name,
            }
        }
    )
}