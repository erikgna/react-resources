import { $ } from "bun"

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

// Allowlist of safe commands for the POC
const ALLOWED = new Set(["ls", "pwd", "date", "uname", "whoami", "env", "df"])

export async function handleShell(req: Request): Promise<Response | null> {
  const url = new URL(req.url)
  const path = url.pathname

  // GET /shell/info — system info via Bun Shell
  if (req.method === "GET" && path === "/shell/info") {
    const [platform, arch, date, cwd] = await Promise.all([
      $`uname -s`.text(),
      $`uname -m`.text(),
      $`date -u +"%Y-%m-%dT%H:%M:%SZ"`.text(),
      $`pwd`.text(),
    ])
    return json({
      platform: platform.trim(),
      arch: arch.trim(),
      date: date.trim(),
      cwd: cwd.trim(),
    })
  }

  // GET /shell/files — list src files using glob + shell
  if (req.method === "GET" && path === "/shell/files") {
    const lines = await $`find src -name "*.ts" | sort`.lines()
    return json({ files: lines.filter(Boolean) })
  }

  // GET /shell/build — invoke Bun.build() programmatically
  if (req.method === "GET" && path === "/shell/build") {
    const result = await Bun.build({
      entrypoints: ["src/index.ts"],
      outdir: "./dist",
      target: "bun",
      minify: false,
    })
    return json({
      success: result.success,
      outputs: result.outputs.map((o) => ({ path: o.path, size: o.size })),
      logs: result.logs,
    })
  }

  // POST /shell/run — run an allowlisted command
  if (req.method === "POST" && path === "/shell/run") {
    const body = await req.json<{ cmd?: string }>()
    if (!body.cmd) return json({ error: "cmd required" }, 400)

    const base = body.cmd.split(" ")[0]
    if (!ALLOWED.has(base)) {
      return json({ error: `command not allowed. allowed: ${[...ALLOWED].join(", ")}` }, 403)
    }

    const parts = body.cmd.split(" ")
    const output = await $`${parts}`.text().catch((e: Error) => `ERROR: ${e.message}`)
    return json({ cmd: body.cmd, output: output.trim() })
  }

  return null
}
