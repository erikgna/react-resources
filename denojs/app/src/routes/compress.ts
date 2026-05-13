import { encodeBase64, decodeBase64 } from "@std/encoding";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function compress(data: Uint8Array, format: CompressionFormat): Promise<Uint8Array> {
  const stream = new CompressionStream(format);
  const writer = stream.writable.getWriter();
  writer.write(data);
  writer.close();
  const chunks: Uint8Array[] = [];
  const reader = stream.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const result = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let offset = 0;
  for (const c of chunks) { result.set(c, offset); offset += c.length; }
  return result;
}

async function decompress(data: Uint8Array, format: CompressionFormat): Promise<Uint8Array> {
  const stream = new DecompressionStream(format);
  const writer = stream.writable.getWriter();
  writer.write(data);
  writer.close();
  const chunks: Uint8Array[] = [];
  const reader = stream.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const result = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let offset = 0;
  for (const c of chunks) { result.set(c, offset); offset += c.length; }
  return result;
}

export async function handleCompress(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/compress/demo" && req.method === "GET") {
    const text = "Deno uses standard Web APIs — CompressionStream is built into the platform. ".repeat(20);
    const raw = new TextEncoder().encode(text);
    const results: Record<string, unknown> = {};

    for (const fmt of ["gzip", "deflate", "deflate-raw"] as CompressionFormat[]) {
      const t0 = performance.now();
      const compressed = await compress(raw, fmt);
      const decompressed = await decompress(compressed, fmt);
      results[fmt] = {
        originalBytes: raw.length,
        compressedBytes: compressed.length,
        ratio: (compressed.length / raw.length).toFixed(3),
        roundtripOk: new TextDecoder().decode(decompressed) === text,
        durationMs: (performance.now() - t0).toFixed(3),
      };
    }
    return json(results);
  }

  if (path === "/compress/gzip" && req.method === "POST") {
    const body = await req.json();
    const raw = new TextEncoder().encode(body.text);
    const compressed = await compress(raw, "gzip");
    return json({ base64: encodeBase64(compressed), originalBytes: raw.length, compressedBytes: compressed.length });
  }

  if (path === "/compress/gunzip" && req.method === "POST") {
    const body = await req.json();
    const compressed = decodeBase64(body.base64);
    const decompressed = await decompress(compressed, "gzip");
    return json({ text: new TextDecoder().decode(decompressed) });
  }

  if (path === "/compress/deflate" && req.method === "POST") {
    const body = await req.json();
    const raw = new TextEncoder().encode(body.text);
    const compressed = await compress(raw, "deflate");
    return json({ base64: encodeBase64(compressed), originalBytes: raw.length, compressedBytes: compressed.length });
  }

  if (path === "/compress/inflate" && req.method === "POST") {
    const body = await req.json();
    const compressed = decodeBase64(body.base64);
    const decompressed = await decompress(compressed, "deflate");
    return json({ text: new TextDecoder().decode(decompressed) });
  }

  return null;
}
