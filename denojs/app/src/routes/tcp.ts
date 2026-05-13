const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const TCP_PORT = 4321;

async function echo(message: string): Promise<{ reply: string; durationMs: number }> {
  const conn = await Deno.connect({ port: TCP_PORT });
  const start = performance.now();
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  await conn.write(enc.encode(message));
  const buf = new Uint8Array(4096);
  const n = await conn.read(buf);
  conn.close();
  return { reply: dec.decode(buf.subarray(0, n ?? 0)), durationMs: performance.now() - start };
}

// TCP echo server — started once at module load
const server = Deno.listen({ port: TCP_PORT });
(async () => {
  for await (const conn of server) {
    (async () => {
      const buf = new Uint8Array(4096);
      const n = await conn.read(buf);
      if (n) await conn.write(buf.subarray(0, n));
      conn.close();
    })();
  }
})();

export async function handleTcp(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/tcp/info" && req.method === "GET") {
    return json({ port: TCP_PORT, hostname: "127.0.0.1", protocol: "TCP echo" });
  }

  if (path === "/tcp/echo" && req.method === "POST") {
    const body = await req.json();
    const result = await echo(body.message ?? "ping");
    return json(result);
  }

  if (path === "/tcp/burst" && req.method === "GET") {
    const start = performance.now();
    const results = [];
    for (let i = 0; i < 10; i++) {
      results.push(await echo(`burst-${i}`));
    }
    return json({ totalMs: performance.now() - start, count: results.length, results });
  }

  return null;
}
