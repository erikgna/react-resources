import { assertEquals, assertExists, assert } from "@std/assert";

// --- crypto.subtle ---

Deno.test("crypto.randomUUID produces valid UUID v4", () => {
  const uuid = crypto.randomUUID();
  assertEquals(uuid.length, 36);
  assertEquals(uuid[14], "4");
});

Deno.test("AES-GCM-256 encrypt/decrypt round-trip", async () => {
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const message = enc.encode("hello deno");

  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, message);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);

  assertEquals(new TextDecoder().decode(decrypted), "hello deno");
});

Deno.test("ECDSA P-256 sign/verify", async () => {
  const { privateKey, publicKey } = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const data = new TextEncoder().encode("sign this");
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, data);
  const valid = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, publicKey, sig, data);
  assertEquals(valid, true);
});

Deno.test("SHA-256 digest is deterministic", async () => {
  const data = new TextEncoder().encode("deno");
  const buf1 = await crypto.subtle.digest("SHA-256", data);
  const buf2 = await crypto.subtle.digest("SHA-256", data);
  assertEquals(new Uint8Array(buf1), new Uint8Array(buf2));
});

// --- CompressionStream / DecompressionStream ---

async function gzip(data: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream("gzip");
  const w = cs.writable.getWriter();
  w.write(data.slice()); w.close();
  const chunks: Uint8Array[] = [];
  const r = cs.readable.getReader();
  while (true) { const { done, value } = await r.read(); if (done) break; chunks.push(value); }
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

async function gunzip(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("gzip");
  const w = ds.writable.getWriter();
  w.write(data.slice()); w.close();
  const chunks: Uint8Array[] = [];
  const r = ds.readable.getReader();
  while (true) { const { done, value } = await r.read(); if (done) break; chunks.push(value); }
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

Deno.test("gzip/gunzip round-trip", async () => {
  const original = "Deno uses Web Platform APIs — CompressionStream is native.".repeat(10);
  const raw = new TextEncoder().encode(original);
  const compressed = await gzip(raw);
  const decompressed = await gunzip(compressed);
  assertEquals(new TextDecoder().decode(decompressed), original);
  assert(compressed.length < raw.length, "compressed should be smaller");
});

// --- Deno.Command ---

Deno.test("Deno.Command captures stdout", async () => {
  const cmd = new Deno.Command("echo", { args: ["hello"], stdout: "piped" });
  const { stdout, code } = await cmd.output();
  assertEquals(code, 0);
  assertEquals(new TextDecoder().decode(stdout).trim(), "hello");
});

Deno.test("Deno.Command parallel execution", async () => {
  const [a, b] = await Promise.all([
    new Deno.Command("echo", { args: ["a"], stdout: "piped" }).output(),
    new Deno.Command("echo", { args: ["b"], stdout: "piped" }).output(),
  ]);
  assertEquals(new TextDecoder().decode(a.stdout).trim(), "a");
  assertEquals(new TextDecoder().decode(b.stdout).trim(), "b");
});

// --- Deno.permissions ---

Deno.test("Deno.permissions.query returns valid state", async () => {
  const result = await Deno.permissions.query({ name: "env" });
  assert(["granted", "prompt", "denied"].includes(result.state));
});

// --- Deno.openKv ---

Deno.test("Deno KV set/get/delete", async () => {
  const kv = await Deno.openKv();
  await kv.set(["test", "key"], "value123");
  const entry = await kv.get(["test", "key"]);
  assertEquals(entry.value, "value123");
  await kv.delete(["test", "key"]);
  const deleted = await kv.get(["test", "key"]);
  assertEquals(deleted.value, null);
  kv.close();
});

Deno.test("Deno KV atomic transaction", async () => {
  const kv = await Deno.openKv();
  const result = await kv.atomic()
    .set(["atomic", "a"], 1)
    .set(["atomic", "b"], 2)
    .commit();
  assertEquals(result.ok, true);
  const a = await kv.get(["atomic", "a"]);
  const b = await kv.get(["atomic", "b"]);
  assertEquals(a.value, 1);
  assertEquals(b.value, 2);
  kv.close();
});

// --- Deno system APIs ---

Deno.test("Deno.version has expected fields", () => {
  assertExists(Deno.version.deno);
  assertExists(Deno.version.v8);
  assertExists(Deno.version.typescript);
});

Deno.test("Deno.memoryUsage returns positive values", () => {
  const mem = Deno.memoryUsage();
  assert(mem.rss > 0);
  assert(mem.heapTotal > 0);
  assert(mem.heapUsed > 0);
});

Deno.test("performance.now() increases monotonically", () => {
  const t0 = performance.now();
  const t1 = performance.now();
  assert(t1 >= t0);
});

Deno.test("structuredClone deep-copies without reference sharing", () => {
  const original = { a: { b: 1 } };
  const clone = structuredClone(original);
  clone.a.b = 99;
  assertEquals(original.a.b, 1);
});
