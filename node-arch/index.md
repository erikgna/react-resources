## Reactor Pattern

**Blocking I/O:** Pause execution (sync)
**Non-Blocking I/O:** Keep execution (async)

**Note:** NodeJS is async for nature.

### How it works

1. Users send requests (blocking or non-blocking) to the server for performing operations.
2. The requests enter the Event Queue first at the server-side.
3. The Event queue passes the requests sequentially to the event loop. The event loop checks the nature of the request (blocking or non-blocking).
4. Event Loop processes the non-blocking requests which do not require external resources and returns the responses to the corresponding clients
5. For blocking requests, a single thread is assigned to the process for completing the task by using external resources.
6. After the completion of the operation, the request is redirected to the Event Loop which delivers the response back to the client.

https://nodejs.org/en/learn/getting-started/fetch