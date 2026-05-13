const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function handleUtils(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/utils/version" && req.method === "GET") {
    return json({
      deno: Deno.version,
      pid: Deno.pid,
      mainModule: Deno.mainModule,
      uptimeMs: performance.now(),
    });
  }

  if (path === "/utils/env" && req.method === "GET") {
    const safe = ["HOME", "USER", "PATH", "SHELL", "TERM", "LANG"];
    const env: Record<string, string | undefined> = {};
    for (const k of safe) env[k] = Deno.env.get(k);
    return json(env);
  }

  if (path === "/utils/memory" && req.method === "GET") {
    const mem = Deno.memoryUsage();
    return json({
      rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      external: `${(mem.external / 1024 / 1024).toFixed(2)} MB`,
    });
  }

  if (path === "/utils/sys" && req.method === "GET") {
    return json({
      hostname: Deno.hostname(),
      build: Deno.build,
      networkInterfaces: Deno.networkInterfaces(),
    });
  }

  if (path === "/utils/timing" && req.method === "GET") {
    performance.mark("start");
    const samples: number[] = [];
    for (let i = 0; i < 10_000; i++) samples.push(performance.now());
    performance.mark("end");
    performance.measure("10k samples", "start", "end");
    const measure = performance.getEntriesByName("10k samples")[0];
    const diffs = samples.slice(1).map((t, i) => t - samples[i]).filter((d) => d > 0);
    return json({
      sampleCount: samples.length,
      measureDurationMs: measure.duration.toFixed(6),
      minResolutionMs: Math.min(...diffs).toFixed(6),
      avgResolutionMs: (diffs.reduce((a, b) => a + b, 0) / diffs.length).toFixed(6),
    });
  }

  if (path === "/utils/clone" && req.method === "POST") {
    const body = await req.json();
    const iterations = body.iterations ?? 10_000;
    const obj = body.data ?? { a: 1, b: [1, 2, 3], c: { nested: true } };
    const start = performance.now();
    for (let i = 0; i < iterations; i++) structuredClone(obj);
    const durationMs = performance.now() - start;
    return json({
      iterations,
      totalMs: durationMs.toFixed(3),
      perOpUs: ((durationMs / iterations) * 1000).toFixed(3),
    });
  }

  return null;
}
