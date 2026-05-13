const TCP_PORT = 4321

// Echo server started at module load — persists for the process lifetime
const tcpServer = Bun.listen<{ received: string }>({
  hostname: "127.0.0.1",
  port: TCP_PORT,
  socket: {
    open(socket) {
      socket.data = { received: "" }
    },
    data(socket, chunk) {
      // Echo every byte back
      socket.write(chunk)
    },
    close(_socket) {},
    error(_socket, err) {
      console.error("TCP server error:", err)
    },
  },
})

console.log(`TCP echo server on port ${TCP_PORT}`)

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function tcpRoundTrip(message: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: string[] = []

    Bun.connect<{ done: boolean }>({
      hostname: "127.0.0.1",
      port: TCP_PORT,
      socket: {
        open(socket) {
          socket.data = { done: false }
          socket.write(message)
          // Signal end after writing so server stops reading
          socket.flush()
        },
        data(socket, chunk) {
          chunks.push(chunk.toString())
          if (!socket.data.done) {
            socket.data.done = true
            socket.end()
          }
        },
        close() {
          resolve(chunks.join(""))
        },
        error(_socket, err) {
          reject(err)
        },
        drain(_socket) {},
      },
    }).catch(reject)
  })
}

export async function handleTcp(req: Request): Promise<Response | null> {
  const url = new URL(req.url)
  const path = url.pathname

  // GET /tcp/info — server metadata
  if (req.method === "GET" && path === "/tcp/info") {
    return json({
      hostname: tcpServer.hostname,
      port: tcpServer.port,
      note: "Bun.listen() = TCP server. Bun.connect() = TCP client. Both use non-blocking I/O with socket handlers.",
    })
  }

  // POST /tcp/echo — send message, receive echo
  if (req.method === "POST" && path === "/tcp/echo") {
    const body = await req.json<{ message?: string }>()
    const message = body.message ?? "ping from Bun.connect()"

    const start = Bun.nanoseconds()
    const echoed = await tcpRoundTrip(message)
    const elapsedMicros = ((Bun.nanoseconds() - start) / 1000).toFixed(1)

    return json({
      sent: message,
      echoed,
      match: message === echoed,
      elapsedMicros,
      note: "Bun.connect() opens TCP connection, writes, receives echo, closes. All via async socket handlers.",
    })
  }

  // GET /tcp/burst — send N messages sequentially, measure throughput
  if (req.method === "GET" && path === "/tcp/burst") {
    const n = 10
    const message = "bun-tcp-test-message"
    const start = Bun.nanoseconds()

    for (let i = 0; i < n; i++) {
      await tcpRoundTrip(`${message}-${i}`)
    }

    const elapsedMs = ((Bun.nanoseconds() - start) / 1_000_000).toFixed(2)
    return json({
      messages: n,
      elapsedMs,
      avgMicros: ((Bun.nanoseconds() - start) / 1000 / n).toFixed(1),
      note: `${n} sequential TCP round-trips to localhost echo server`,
    })
  }

  return null
}
