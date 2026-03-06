import { useState, useCallback } from 'react';
import { fetchClient } from '../api/fetchClient';

export interface UseApiOptions {
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
}

export function useApi<T>(endpoint: string, options: any = {}) {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const execute = useCallback(
        async (params?: any) => {
            setIsLoading(true);
            setError(null);

            try {
                // Merge initial options with any params passed to execute
                const result = await fetchClient(endpoint, { ...options, ...params });
                setData(result);
                options.onSuccess?.(result);
                return result;
            } catch (err: any) {
                const errorInstance = err instanceof Error ? err : new Error(err);
                setError(errorInstance);
                options.onError?.(errorInstance);
                throw errorInstance; // Re-throw so the caller can handle it if needed
            } finally {
                setIsLoading(false);
            }
        },
        [endpoint, options]
    );

    return { data, isLoading, error, execute };
}