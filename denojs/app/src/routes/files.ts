import { join } from "@std/path";

const UPLOADS = "./uploads";
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function handleFiles(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/files" && req.method === "GET") {
    const names: string[] = [];
    for await (const entry of Deno.readDir(UPLOADS)) {
      if (entry.isFile && entry.name !== ".gitkeep") names.push(entry.name);
    }
    return json(names);
  }

  if (path === "/files" && req.method === "POST") {
    const contentType = req.headers.get("content-type") ?? "";
    let name: string;
    let data: Uint8Array;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File;
      if (!file) return json({ error: "no file field" }, 400);
      name = file.name;
      data = new Uint8Array(await file.arrayBuffer());
    } else {
      name = url.searchParams.get("name") ?? `upload-${Date.now()}.bin`;
      data = new Uint8Array(await req.arrayBuffer());
    }

    await Deno.writeFile(join(UPLOADS, name), data);
    const stat = await Deno.stat(join(UPLOADS, name));
    return json({ name, size: stat.size }, 201);
  }

  const fileMatch = path.match(/^\/files\/(.+)$/);
  if (!fileMatch) return null;
  const name = fileMatch[1];
  const filePath = join(UPLOADS, name);

  if (req.method === "GET") {
    try {
      const file = await Deno.open(filePath, { read: true });
      return new Response(file.readable, {
        headers: { "Content-Disposition": `attachment; filename="${name}"` },
      });
    } catch {
      return json({ error: "not found" }, 404);
    }
  }

  if (req.method === "DELETE") {
    try {
      await Deno.remove(filePath);
      return json({ deleted: name });
    } catch {
      return json({ error: "not found" }, 404);
    }
  }

  return null;
}
