import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const cache = new Map<string, { data: any; expiry: number }>();

interface CustomConfig extends InternalAxiosRequestConfig {
  ttl?: number;
  useCache?: boolean;
  retries?: number;
  retryCount?: number;
  retryDelay?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const axiosClient = axios.create({
  baseURL: "https://jsonplaceholder.typicode.com",
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config: CustomConfig) => {
  const { useCache, method, url } = config;
  const isGet = method?.toUpperCase() === "GET";

  if (useCache && isGet && url) {
    const cachedItem = cache.get(url);
    if (cachedItem && Date.now() < cachedItem.expiry) {
      config.adapter = () => Promise.resolve({
        data: cachedItem.data,
        status: 200,
        statusText: "OK",
        headers: config.headers,
        config,
      });
    }
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    const config = response.config as CustomConfig;
    const { useCache, ttl = 60000, method, url } = config;

    if (useCache && method?.toUpperCase() === "GET" && url) {
      cache.set(url, { data: response.data, expiry: Date.now() + ttl });
    }

    return response.data;
  },
  async (error: AxiosError) => {
    const config = error.config as CustomConfig;

    if (!config || config.retries === undefined) return Promise.reject(error);

    config.retryCount = config.retryCount ?? 0;

    const shouldRetry = config.retryCount < config.retries;
    const isNetworkError = !error.response;
    const isServerError = error.response && error.response.status >= 500;

    if (shouldRetry && (isNetworkError || isServerError)) {
      config.retryCount += 1;

      const delay = (config.retryDelay ?? 1000) * Math.pow(2, config.retryCount - 1);
      console.warn(`Retry attempt ${config.retryCount} for ${config.url}. Waiting ${delay}ms...`);

      await sleep(delay);

      return axiosClient(config);
    }

    return Promise.reject(error);
  }
);