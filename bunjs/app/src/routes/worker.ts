function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

const WORKER_URL = new URL("../workers/compute.ts", import.meta.url).href

type WorkerTask = "fibonacci" | "isPrime" | "sumPrimes"

function runWorker(type: WorkerTask, n: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_URL)

    worker.onmessage = (e: MessageEvent<{ result?: number; error?: string }>) => {
      worker.terminate()
      if (e.data.error) reject(new Error(e.data.error))
      else resolve(e.data.result!)
    }

    worker.onerror = (e) => {
      worker.terminate()
      reject(new Error(e.message))
    }

    worker.postMessage({ type, n })
  })
}

export async function handleWorker(req: Request): Promise<Response | null> {
  const url = new URL(req.url)
  const path = url.pathname

  // POST /worker/compute — offload CPU work to a Worker thread
  if (req.method === "POST" && path === "/worker/compute") {
    const body = await req.json<{ type?: WorkerTask; n?: number }>()
    const type = body.type ?? "fibonacci"
    const n = body.n ?? 35

    if (!["fibonacci", "isPrime", "sumPrimes"].includes(type)) {
      return json({ error: "type must be: fibonacci | isPrime | sumPrimes" }, 400)
    }

    if (n > 45 && type === "fibonacci") {
      return json({ error: "fibonacci n ≤ 45 (above that takes too long)" }, 400)
    }

    const start = Bun.nanoseconds()
    const result = await runWorker(type, n)
    const elapsedMs = ((Bun.nanoseconds() - start) / 1_000_000).toFixed(2)

    return json({
      type,
      n,
      result,
      elapsedMs,
      note: "Worker runs on a separate thread — main thread stays unblocked during CPU-intensive work",
    })
  }

  // GET /worker/race — spawn 3 workers simultaneously, race them
  if (req.method === "GET" && path === "/worker/race") {
    const start = Bun.nanoseconds()

    const [fib, prime, sumPrimes] = await Promise.all([
      runWorker("fibonacci", 38),
      runWorker("isPrime", 982451653),   // largest prime < 10^9
      runWorker("sumPrimes", 10_000),
    ])

    const elapsedMs = ((Bun.nanoseconds() - start) / 1_000_000).toFixed(2)

    return json({
      fibonacci38: fib,
      isPrime982451653: prime,
      sumPrimesTo10k: sumPrimes,
      elapsedMs,
      note: "All 3 workers ran in parallel on separate threads",
    })
  }

  return null
}
