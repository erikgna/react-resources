function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

// Allowlist — Bun.spawn() gives full process control vs Shell's scripting ergonomics
const SPAWN_ALLOWED = new Set(["ls", "pwd", "date", "uname", "whoami", "bun"])

export async function handleProcess(req: Request): Promise<Response | null> {
  const url = new URL(req.url)
  const path = url.pathname

  // GET /process/timing — Bun.nanoseconds() high-resolution benchmark
  if (req.method === "GET" && path === "/process/timing") {
    const iterations = 1_000_000
    const start = Bun.nanoseconds()
    let x = 0
    for (let i = 0; i < iterations; i++) x += i
    const elapsed = Bun.nanoseconds() - start

    return json({
      task: `sum 0..${iterations}`,
      result: x,
      elapsedNs: elapsed,
      elapsedMs: (elapsed / 1_000_000).toFixed(3),
      note: "Bun.nanoseconds() = ns since process start. Higher precision than Date.now() or performance.now().",
    })
  }

  // GET /process/info — process metadata
  if (req.method === "GET" && path === "/process/info") {
    return json({
      version: Bun.version,
      revision: Bun.revision,
      pid: process.pid,
      platform: process.platform,
      arch: process.arch,
      uptimeNs: Bun.nanoseconds(),
      argv: process.argv,
      main: Bun.main,
    })
  }

  // POST /process/spawn — Bun.spawn() demo: full process control
  if (req.method === "POST" && path === "/process/spawn") {
    const body = await req.json<{ cmd?: string[]; stdin?: string }>()
    if (!body.cmd?.length) return json({ error: "cmd array required" }, 400)

    const base = body.cmd[0]
    if (!SPAWN_ALLOWED.has(base)) {
      return json({ error: `not allowed. allowed: ${[...SPAWN_ALLOWED].join(", ")}` }, 403)
    }

    const proc = Bun.spawn(body.cmd, {
      stdout: "pipe",
      stderr: "pipe",
      // stdin can be a string, ReadableStream, or "pipe"
      stdin: body.stdin ? body.stdin : "ignore",
    })

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ])

    return json({
      cmd: body.cmd,
      stdout: stdout.trim(),
      stderr: stderr.trim() || null,
      exitCode,
      note: "Bun.spawn() vs Shell $: spawn gives pid, kill(), exitCode, piped streams. Shell is ergonomic for scripting.",
    })
  }

  // GET /process/spawn/parallel — spawn N processes simultaneously
  if (req.method === "GET" && path === "/process/spawn/parallel") {
    const commands = [
      ["bun", "--version"],
      ["uname", "-s"],
      ["date", "-u"],
    ]

    const start = Bun.nanoseconds()
    const procs = commands.map((cmd) =>
      Bun.spawn(cmd, { stdout: "pipe", stderr: "ignore" })
    )

    const results = await Promise.all(
      procs.map(async (proc, i) => ({
        cmd: commands[i].join(" "),
        output: (await new Response(proc.stdout).text()).trim(),
        exit: await proc.exited,
      }))
    )

    return json({
      results,
      totalMs: ((Bun.nanoseconds() - start) / 1_000_000).toFixed(2),
      note: "All 3 spawned simultaneously, awaited in parallel",
    })
  }

  return null
}
