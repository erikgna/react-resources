const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

type PermName = "net" | "read" | "write" | "env" | "run" | "ffi" | "sys";

const ALL_PERMS: PermName[] = ["net", "read", "write", "env", "run", "ffi", "sys"];

async function queryPerm(name: PermName): Promise<{ name: string; state: string }> {
  try {
    const status = await Deno.permissions.query({ name } as Deno.PermissionDescriptor);
    return { name, state: status.state };
  } catch {
    return { name, state: "unavailable" };
  }
}

export async function handlePermissions(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/permissions" && req.method === "GET") {
    const results = await Promise.all(ALL_PERMS.map(queryPerm));
    return json({
      description: "Deno uses a default-deny permission model. Each capability must be explicitly granted.",
      permissions: results,
      grantedWith: "--allow-all (for this POC)",
    });
  }

  const permMatch = path.match(/^\/permissions\/(\w+)$/);
  if (!permMatch || req.method !== "GET") return null;

  const name = permMatch[1] as PermName;
  if (!ALL_PERMS.includes(name)) return json({ error: `unknown permission: ${name}` }, 400);

  const result = await queryPerm(name);
  return json({
    ...result,
    description: permDesc(name),
    granularExample: granularExample(name),
  });
}

function permDesc(name: PermName): string {
  const map: Record<PermName, string> = {
    net: "Network access (listen, connect, fetch). Scope to --allow-net=example.com",
    read: "Filesystem reads. Scope to --allow-read=/tmp",
    write: "Filesystem writes. Scope to --allow-write=/tmp",
    env: "Environment variables. Scope to --allow-env=HOME,PATH",
    run: "Subprocess execution. Scope to --allow-run=ls,echo",
    ffi: "Foreign Function Interface (native libs). --allow-ffi",
    sys: "System info (hostname, interfaces). --allow-sys",
  };
  return map[name] ?? "unknown";
}

function granularExample(name: PermName): string {
  const map: Record<PermName, string> = {
    net: "deno run --allow-net=api.example.com main.ts",
    read: "deno run --allow-read=./uploads main.ts",
    write: "deno run --allow-write=./uploads main.ts",
    env: "deno run --allow-env=DATABASE_URL main.ts",
    run: "deno run --allow-run=git,ls main.ts",
    ffi: "deno run --allow-ffi=./lib.so main.ts",
    sys: "deno run --allow-sys=hostname main.ts",
  };
  return map[name] ?? "";
}
