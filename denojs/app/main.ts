import { handleWebSocket, handleTasks } from "./src/routes/tasks.ts";
import { handleFiles } from "./src/routes/files.ts";
import { handleKv } from "./src/routes/kv.ts";
import { handleProcess } from "./src/routes/process.ts";
import { handleCrypto } from "./src/routes/crypto.ts";
import { handleCompress } from "./src/routes/compress.ts";
import { handleWorker } from "./src/routes/worker.ts";
import { handleTcp } from "./src/routes/tcp.ts";
import { handlePermissions } from "./src/routes/permissions.ts";
import { handleUtils } from "./src/routes/utils.ts";

const PORT = 3000;

const ROUTES: ((req: Request) => Response | Promise<Response | null> | null)[] = [
  handleWebSocket,
  handleTasks,
  handleFiles,
  handleKv,
  handleProcess,
  handleCrypto,
  handleCompress,
  handleWorker,
  handleTcp,
  handlePermissions,
  handleUtils,
];

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/" || url.pathname === "/health") {
    return new Response(
      JSON.stringify({
        runtime: "Deno",
        version: Deno.version,
        uptime: performance.now(),
        routes: [
          "GET  /tasks                    — list tasks",
          "POST /tasks                    — create task { title }",
          "POST /tasks                    — bulk create { titles: [] }",
          "GET  /tasks/:id                — get task",
          "PATCH /tasks/:id               — update { done: bool }",
          "DELETE /tasks/:id              — delete task",
          "WS   /ws                       — WebSocket task events",
          "GET  /files                    — list uploaded files",
          "POST /files?name=x             — upload file (raw body)",
          "POST /files                    — upload file (multipart)",
          "GET  /files/:name              — download file",
          "DELETE /files/:name            — delete file",
          "GET  /kv                       — list all KV entries",
          "POST /kv                       — set { key, value }",
          "GET  /kv/:key                  — get value",
          "DELETE /kv/:key                — delete key",
          "POST /kv/atomic               — batch set [{ key, value }]",
          "GET  /kv/watch?key=x           — SSE watch key",
          "GET  /process/info             — PID, build, version",
          "GET  /process/timing           — performance.now() resolution",
          "POST /process/spawn            — run allowlisted cmd { cmd }",
          "GET  /process/spawn/parallel   — 3 cmds in parallel",
          "POST /process/stream           — stream cmd stdout",
          "POST /crypto/digest            — SHA-* digest { message }",
          "GET  /crypto/uuid              — 5x crypto.randomUUID()",
          "POST /crypto/aes               — AES-GCM-256 round-trip { plaintext }",
          "POST /crypto/ecdsa             — ECDSA P-256 sign/verify { message }",
          "POST /crypto/hmac              — HMAC-SHA256 { secret, message }",
          "GET  /compress/demo            — gzip/deflate/deflate-raw comparison",
          "POST /compress/gzip            — gzip { text } → base64",
          "POST /compress/gunzip          — gunzip { base64 } → text",
          "POST /compress/deflate         — deflate { text } → base64",
          "POST /compress/inflate         — inflate { base64 } → text",
          "POST /worker/compute           — run in worker { type, n }",
          "GET  /worker/race              — 3 workers in parallel",
          "GET  /tcp/info                 — TCP echo server info",
          "POST /tcp/echo                 — round-trip { message }",
          "GET  /tcp/burst                — 10 sequential echoes",
          "GET  /permissions              — all permission states",
          "GET  /permissions/:name        — single permission state",
          "GET  /utils/version            — Deno.version + pid",
          "GET  /utils/env                — safe env vars",
          "GET  /utils/memory             — Deno.memoryUsage()",
          "GET  /utils/sys                — hostname + network interfaces",
          "GET  /utils/timing             — performance.now() resolution",
          "POST /utils/clone              — structuredClone benchmark { iterations, data }",
        ],
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  for (const route of ROUTES) {
    const res = await route(req);
    if (res !== null) return res;
  }

  return new Response(JSON.stringify({ error: "not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

console.log(`Deno ${Deno.version.deno} — server listening on http://localhost:${PORT}`);
Deno.serve({ port: PORT }, handler);
