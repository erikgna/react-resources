const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const ALLOWED_CMDS: Record<string, string[]> = {
  ls: ["-la", "src"],
  echo: ["hello from Deno"],
  date: [],
  uname: ["-a"],
  pwd: [],
};

async function runCmd(cmd: string, args: string[]) {
  const start = performance.now();
  const proc = new Deno.Command(cmd, { args, stdout: "piped", stderr: "piped" });
  const { stdout, stderr, code } = await proc.output();
  return {
    stdout: new TextDecoder().decode(stdout),
    stderr: new TextDecoder().decode(stderr),
    code,
    durationMs: performance.now() - start,
  };
}

export async function handleProcess(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/process/info" && req.method === "GET") {
    return json({
      pid: Deno.pid,
      mainModule: Deno.mainModule,
      build: Deno.build,
      version: Deno.version,
      uptimeMs: performance.now(),
    });
  }

  if (path === "/process/timing" && req.method === "GET") {
    const samples: number[] = [];
    for (let i = 0; i < 1000; i++) samples.push(performance.now());
    const diffs = samples.slice(1).map((t, i) => t - samples[i]);
    const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    return json({ samples: 1000, avgResolutionMs: avg, minMs: Math.min(...diffs), maxMs: Math.max(...diffs) });
  }

  if (path === "/process/spawn" && req.method === "POST") {
    const body = await req.json();
    const cmd = body.cmd as string;
    if (!(cmd in ALLOWED_CMDS)) return json({ error: "command not allowed" }, 403);
    const result = await runCmd(cmd, ALLOWED_CMDS[cmd]);
    return json(result);
  }

  if (path === "/process/spawn/parallel" && req.method === "GET") {
    const start = performance.now();
    const [ls, date, uname] = await Promise.all([
      runCmd("ls", ["-la", "src"]),
      runCmd("date", []),
      runCmd("uname", ["-a"]),
    ]);
    return json({ totalMs: performance.now() - start, ls, date, uname });
  }

  if (path === "/process/stream" && req.method === "POST") {
    const body = await req.json();
    const cmd = body.cmd as string;
    if (!(cmd in ALLOWED_CMDS)) return json({ error: "command not allowed" }, 403);

    const proc = new Deno.Command(cmd, {
      args: ALLOWED_CMDS[cmd],
      stdout: "piped",
      stderr: "piped",
    });
    const child = proc.spawn();
    return new Response(child.stdout, { headers: { "Content-Type": "text/plain" } });
  }

  return null;
}
