export function layout(title: string, body: string, extraScripts = ""): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTMX POC — ${title}</title>
  <link rel="stylesheet" href="/styles.css">
  <script src="/htmx.js"></script>
  ${extraScripts}
</head>
<body>
  <nav>
    <a href="/">Home</a>
    <a href="/experiments/basics">01 Basics</a>
    <a href="/experiments/swaps">02 Swaps</a>
    <a href="/experiments/triggers">03 Triggers</a>
    <a href="/experiments/oob">04 OOB</a>
    <a href="/experiments/indicators">05 Indicators</a>
    <a href="/experiments/history">06 History</a>
    <a href="/experiments/sse">07 SSE</a>
    <a href="/experiments/ws">08 WebSockets</a>
    <a href="/experiments/extensions">09 Extensions</a>
    <a href="/experiments/failures">10 Failures</a>
  </nav>
  <main>
    <h1>${title}</h1>
    ${body}
  </main>
  <script>htmx.logAll()</script>
</body>
</html>`
}

export function fragment(html: string): string {
  return html
}
