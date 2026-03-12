import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchClient } from '../api/fetchClient';

export function useApi<T>(endpoint: string, options: any = {}) {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);

    const execute = useCallback(
        async (params?: any) => {
            console.log('execute', params);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            const controller = new AbortController();
            abortControllerRef.current = controller;

            setIsLoading(true);
            setError(null);

            try {
                const result = await fetchClient(endpoint, { 
                    ...options, 
                    ...params, 
                    signal: controller.signal 
                });

                setData(result);
                options.onSuccess?.(result);
                return result;
            } catch (err: any) {
                if (err.name === 'AbortError') {
                    console.log('Request was cancelled');
                    return; 
                }

                const errorInstance = err instanceof Error ? err : new Error(err);
                setError(errorInstance);
                options.onError?.(errorInstance);
                throw errorInstance;
            } finally {
                if (abortControllerRef.current === controller) setIsLoading(false);
            }
        },
        [endpoint, options]
    );

    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    return { data, isLoading, error, execute };
}