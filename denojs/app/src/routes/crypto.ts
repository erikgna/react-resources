const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const enc = new TextEncoder();
const dec = new TextDecoder();

async function digestAll(message: string) {
  const data = enc.encode(message);
  const results: Record<string, string> = {};
  for (const algo of ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const) {
    const start = performance.now();
    const buf = await crypto.subtle.digest(algo, data);
    const hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    results[algo] = `${hex.slice(0, 16)}… (${(performance.now() - start).toFixed(4)}ms)`;
  }
  return results;
}

export async function handleCrypto(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/crypto/uuid" && req.method === "GET") {
    return json({ uuids: Array.from({ length: 5 }, () => crypto.randomUUID()) });
  }

  if (path === "/crypto/digest" && req.method === "POST") {
    const body = await req.json();
    return json(await digestAll(body.message ?? "hello deno"));
  }

  if (path === "/crypto/aes" && req.method === "POST") {
    const body = await req.json();
    const plaintext = enc.encode(body.plaintext ?? "secret message");

    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"],
    );
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const t0 = performance.now();
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
    const encMs = performance.now() - t0;

    const t1 = performance.now();
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    const decMs = performance.now() - t1;

    return json({
      algorithm: "AES-GCM-256",
      plaintextBytes: plaintext.byteLength,
      ciphertextBytes: ciphertext.byteLength,
      decrypted: dec.decode(decrypted),
      encryptMs: encMs.toFixed(4),
      decryptMs: decMs.toFixed(4),
      ivHex: Array.from(iv).map((b) => b.toString(16).padStart(2, "0")).join(""),
    });
  }

  if (path === "/crypto/ecdsa" && req.method === "POST") {
    const body = await req.json();
    const message = enc.encode(body.message ?? "sign me");

    const { privateKey, publicKey } = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"],
    );

    const t0 = performance.now();
    const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, message);
    const signMs = performance.now() - t0;

    const t1 = performance.now();
    const valid = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, publicKey, signature, message);
    const verifyMs = performance.now() - t1;

    const tamperedValid = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      publicKey,
      signature,
      enc.encode("tampered"),
    );

    return json({
      algorithm: "ECDSA P-256",
      signatureBytes: signature.byteLength,
      valid,
      tamperedValid,
      signMs: signMs.toFixed(4),
      verifyMs: verifyMs.toFixed(4),
    });
  }

  if (path === "/crypto/hmac" && req.method === "POST") {
    const body = await req.json();
    const secret = enc.encode(body.secret ?? "my-secret");
    const message = enc.encode(body.message ?? "hello");

    const key = await crypto.subtle.importKey(
      "raw",
      secret,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );

    const sig = await crypto.subtle.sign("HMAC", key, message);
    const valid = await crypto.subtle.verify("HMAC", key, sig, message);
    const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");

    return json({ algorithm: "HMAC-SHA256", hex, valid });
  }

  return null;
}
