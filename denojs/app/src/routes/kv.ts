const kv = await Deno.openKv();

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function handleKv(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/kv" && req.method === "GET") {
    const entries: { key: string; value: unknown }[] = [];
    const iter = kv.list<unknown>({ prefix: [] });
    for await (const entry of iter) {
      entries.push({ key: entry.key.join("."), value: entry.value });
    }
    return json(entries);
  }

  if (path === "/kv" && req.method === "POST") {
    const body = await req.json();
    const key = [body.key];
    const result = await kv.set(key, body.value);
    return json({ key: body.key, value: body.value, versionstamp: result.versionstamp }, 201);
  }

  if (path === "/kv/atomic" && req.method === "POST") {
    const body = await req.json() as Array<{ key: string; value: unknown }>;
    let op = kv.atomic();
    for (const { key, value } of body) op = op.set([key], value);
    const result = await op.commit();
    return json({ ok: result.ok, count: body.length });
  }

  if (path === "/kv/watch" && req.method === "GET") {
    const key = url.searchParams.get("key");
    if (!key) return json({ error: "?key= required" }, 400);

    const stream = new ReadableStream({
      async start(controller) {
        const watcher = kv.watch<unknown[]>([[key]]);
        for await (const [entry] of watcher) {
          const data = `data: ${JSON.stringify({ key, value: entry.value })}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  }

  const kvMatch = path.match(/^\/kv\/(.+)$/);
  if (!kvMatch) return null;
  const key = [kvMatch[1]];

  if (req.method === "GET") {
    const entry = await kv.get(key);
    if (entry.value === null) return json({ error: "not found" }, 404);
    return json({ key: kvMatch[1], value: entry.value, versionstamp: entry.versionstamp });
  }

  if (req.method === "DELETE") {
    await kv.delete(key);
    return json({ deleted: kvMatch[1] });
  }

  return null;
}
