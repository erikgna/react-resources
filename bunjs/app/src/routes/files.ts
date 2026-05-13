import { join } from "path"

const UPLOAD_DIR = "./uploads"
await Bun.write(join(UPLOAD_DIR, ".gitkeep"), "").catch(() => {})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export async function handleFiles(req: Request): Promise<Response | null> {
  const url = new URL(req.url)
  const path = url.pathname

  // GET /files — list uploaded files
  if (req.method === "GET" && path === "/files") {
    const glob = new Bun.Glob("*")
    const names: string[] = []
    for await (const name of glob.scan(UPLOAD_DIR)) {
      if (name !== ".gitkeep") names.push(name)
    }
    return json(names)
  }

  // GET /files/:name — stream file
  const matchName = path.match(/^\/files\/([^/]+)$/)
  if (matchName && req.method === "GET") {
    const name = decodeURIComponent(matchName[1])
    const file = Bun.file(join(UPLOAD_DIR, name))
    const exists = await file.exists()
    if (!exists) return json({ error: "not found" }, 404)

    // Bun.file() streams without buffering the whole file
    return new Response(file, {
      headers: {
        "Content-Type": file.type,
        "Content-Length": String(file.size),
      },
    })
  }

  // POST /files — upload (multipart or raw body)
  if (req.method === "POST" && path === "/files") {
    const contentType = req.headers.get("content-type") ?? ""

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData()
      const saved: string[] = []

      for (const [, value] of form.entries()) {
        if (value instanceof File) {
          const dest = join(UPLOAD_DIR, value.name)
          await Bun.write(dest, value)
          saved.push(value.name)
        }
      }
      return json({ saved }, 201)
    }

    // Raw body upload — name from query param
    const name = url.searchParams.get("name")
    if (!name) return json({ error: "?name= required for raw upload" }, 400)
    const dest = join(UPLOAD_DIR, name)
    await Bun.write(dest, req.body!)
    const file = Bun.file(dest)
    return json({ saved: name, size: file.size, type: file.type }, 201)
  }

  // DELETE /files/:name
  if (matchName && req.method === "DELETE") {
    const name = decodeURIComponent(matchName[1])
    const file = Bun.file(join(UPLOAD_DIR, name))
    const exists = await file.exists()
    if (!exists) return json({ error: "not found" }, 404)
    // Bun doesn't expose a native unlink yet — use Node compat
    const { unlink } = await import("fs/promises")
    await unlink(join(UPLOAD_DIR, name))
    return json({ deleted: name })
  }

  return null
}
