const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function runWorker(type: string, n: number): Promise<{ result: number; durationMs: number }> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(import.meta.resolve("../workers/compute.ts"), { type: "module" });
    worker.postMessage({ type, n });
    worker.onmessage = (e) => {
      worker.terminate();
      resolve(e.data);
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(e);
    };
  });
}

export async function handleWorker(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/worker/compute" && req.method === "POST") {
    const body = await req.json();
    const { type, n } = body as { type: string; n: number };
    if (!["fibonacci", "isPrime", "sumPrimes"].includes(type)) {
      return json({ error: "type must be fibonacci | isPrime | sumPrimes" }, 400);
    }
    const start = performance.now();
    const result = await runWorker(type, n);
    return json({ type, n, ...result, totalMs: performance.now() - start });
  }

  if (path === "/worker/race" && req.method === "GET") {
    const start = performance.now();
    const [fib, prime, sum] = await Promise.all([
      runWorker("fibonacci", 40),
      runWorker("isPrime", 7919),
      runWorker("sumPrimes", 10000),
    ]);
    return json({
      totalMs: performance.now() - start,
      fibonacci40: fib,
      isPrime7919: prime,
      sumPrimesTo10000: sum,
    });
  }

  return null;
}
