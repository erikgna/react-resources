import { useState, useCallback, useRef, useEffect } from 'react';
import axios, { type AxiosRequestConfig } from 'axios';
import { axiosClient } from '../api/axiosClient';

export function useAxios<T>(endpoint: string, options: any = {}) {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    const execute = useCallback(
        async (dynamicConfig: AxiosRequestConfig = {}) => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            const controller = new AbortController();
            abortControllerRef.current = controller;

            setIsLoading(true);
            setError(null);

            try {
                const result = await axiosClient({
                    url: endpoint,
                    ...optionsRef.current,
                    ...dynamicConfig,
                    signal: controller.signal,
                });

                setData(result.data);
                optionsRef.current.onSuccess?.(result.data);
                return result.data;
            } catch (err: any) {
                if (axios.isCancel(err)) {
                    console.log('Axios request cancelled:', endpoint);
                    return; 
                }

                const errorInstance = err instanceof Error ? err : new Error(err.message || 'Axios Error');
                setError(errorInstance);
                optionsRef.current.onError?.(errorInstance);
                throw errorInstance;
            } finally {
                if (abortControllerRef.current === controller) {
                    setIsLoading(false);
                }
            }
        },
        [endpoint]
    );

    useEffect(() => {
        return () => abortControllerRef.current?.abort();
    }, []);

    return { data, isLoading, error, execute };
}