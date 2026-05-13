import {
  createTask,
  deleteTask,
  getAllTasks,
  getTask,
  bulkInsert,
  updateTask,
} from "../db.ts";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const channel = new BroadcastChannel("tasks");

export function handleWebSocket(req: Request): Response | null {
  const url = new URL(req.url);
  if (url.pathname !== "/ws") return null;

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    const listener = (e: MessageEvent) => {
      if (socket.readyState === WebSocket.OPEN) socket.send(e.data);
    };
    channel.addEventListener("message", listener);
    socket.onclose = () => channel.removeEventListener("message", listener);
  };

  return response;
}

export async function handleTasks(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/tasks" && req.method === "GET") {
    return json(getAllTasks());
  }

  if (path === "/tasks" && req.method === "POST") {
    const body = await req.json();
    if (Array.isArray(body.titles)) {
      const tasks = bulkInsert(body.titles);
      channel.postMessage(JSON.stringify({ event: "bulk_created", tasks }));
      return json(tasks, 201);
    }
    const task = createTask(body.title);
    channel.postMessage(JSON.stringify({ event: "created", task }));
    return json(task, 201);
  }

  const idMatch = path.match(/^\/tasks\/(\d+)$/);
  if (!idMatch) return null;
  const id = parseInt(idMatch[1]);

  if (req.method === "GET") {
    const task = getTask(id);
    return task ? json(task) : json({ error: "not found" }, 404);
  }

  if (req.method === "PATCH") {
    const body = await req.json();
    const task = updateTask(id, body.done);
    if (!task) return json({ error: "not found" }, 404);
    channel.postMessage(JSON.stringify({ event: "updated", task }));
    return json(task);
  }

  if (req.method === "DELETE") {
    const task = deleteTask(id);
    if (!task) return json({ error: "not found" }, 404);
    channel.postMessage(JSON.stringify({ event: "deleted", id }));
    return json(task);
  }

  return null;
}
