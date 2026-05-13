import {
  createTask,
  getAllTasks,
  getTask,
  updateTask,
  deleteTask,
  bulkInsert,
} from "../db"

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export async function handleTasks(req: Request, server: import("bun").Server): Promise<Response | null> {
  const url = new URL(req.url)
  const path = url.pathname

  // GET /tasks
  if (req.method === "GET" && path === "/tasks") {
    return json(getAllTasks())
  }

  // POST /tasks
  if (req.method === "POST" && path === "/tasks") {
    const body = await req.json<{ title?: string; titles?: string[] }>()

    if (body.titles) {
      // Bulk insert via transaction
      const tasks = bulkInsert(body.titles)
      tasks.forEach((t) => server.publish("tasks", JSON.stringify({ event: "created", task: t })))
      return json(tasks, 201)
    }

    if (!body.title) return json({ error: "title required" }, 400)
    const task = createTask(body.title)
    server.publish("tasks", JSON.stringify({ event: "created", task }))
    return json(task, 201)
  }

  // GET /tasks/:id
  const matchOne = path.match(/^\/tasks\/(\d+)$/)
  if (matchOne) {
    const id = parseInt(matchOne[1])

    if (req.method === "GET") {
      const task = getTask(id)
      return task ? json(task) : json({ error: "not found" }, 404)
    }

    // PATCH /tasks/:id
    if (req.method === "PATCH") {
      const body = await req.json<{ done?: boolean }>()
      if (typeof body.done !== "boolean") return json({ error: "done (boolean) required" }, 400)
      const task = updateTask(id, body.done)
      if (!task) return json({ error: "not found" }, 404)
      server.publish("tasks", JSON.stringify({ event: "updated", task }))
      return json(task)
    }

    // DELETE /tasks/:id
    if (req.method === "DELETE") {
      const ok = deleteTask(id)
      if (!ok) return json({ error: "not found" }, 404)
      server.publish("tasks", JSON.stringify({ event: "deleted", id }))
      return json({ deleted: id })
    }
  }

  return null
}
