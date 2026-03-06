const BASE_URL = "https://jsonplaceholder.typicode.com";
const cache = new Map<string, { data: any; expiry: number }>();

interface FetchOptions extends RequestInit {
  ttl?: number;
  useCache?: boolean;
  retries?: number;
  retryDelay?: number; // Base delay in ms
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchClient(endpoint: string, options: FetchOptions = {}) {
  const {
    ttl = 60000,
    useCache = false,
    retries = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  const url = `${BASE_URL}${endpoint}`;
  const isGet = !fetchOptions.method || fetchOptions.method.toUpperCase() === "GET";

  // 1. Cache Check
  if (useCache && isGet) {
    const cachedItem = cache.get(url);
    if (cachedItem && Date.now() < cachedItem.expiry) {
      return cachedItem.data;
    }
  }

  // 2. Request Logic with Retry Loop
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const config = {
      headers: { "Content-Type": "application/json", ...fetchOptions.headers },
      signal: controller.signal,
      ...fetchOptions,
    };

    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(url, config);

      // Handle successful response
      if (res.ok) {
        const data = await res.json();
        if (useCache && isGet) {
          cache.set(url, { data, expiry: Date.now() + ttl });
        }
        return data;
      }

      // If it's a client error (4xx), don't retry—it's likely a permanent issue
      if (res.status >= 400 && res.status < 500) {
        throw new Error(`Client Error: ${res.status}`);
      }

      // If we reach here, it's likely a 5xx error; throw to trigger the catch block
      throw new Error(`Server Error: ${res.status}`);

    } catch (error: any) {
      const isLastAttempt = attempt === retries;
      const isAbortError = error.name === "AbortError";

      // If we've run out of retries, or if it's a non-retryable error, throw it
      if (isLastAttempt) {
        throw isAbortError ? new Error("Request timeout after retries") : error;
      }

      // Exponential backoff: wait longer after each failed attempt
      const backoffTime = retryDelay * Math.pow(2, attempt);
      console.warn(`Attempt ${attempt + 1} failed. Retrying in ${backoffTime}ms...`);
      await sleep(backoffTime);

    } finally {
      clearTimeout(timeout);
    }
  }
}