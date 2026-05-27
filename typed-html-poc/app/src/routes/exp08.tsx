// exp08 — XSS Probe + Remediation
// PROVEN: typed-html does NOT escape text content (only attribute values)
// contentsToString: just joins strings — no escaping applied
// escapeAttrNodeValue: escapes & "   — attribute values ONLY
//
// Asymmetric behavior:
//   <div title={userInput}>  → escaped (&amp; &quot;)
//   <div>{userInput}</div>   → NOT escaped (raw string injected)
//
// Remediation: use Bun.escapeHTML(input) before passing to JSX content
import * as elements from 'typed-html'

const XSS_PAYLOAD = '<script>alert("XSS")</script>'
const SQL_PAYLOAD = "' OR '1'='1"
const HTML_INJECTION = '<h1 style="color:red">Injected heading</h1>'

// DANGEROUS — raw user input in content (DO NOT DO THIS)
function unsafeRender(input: string): string {
  return (
    <div class="unsafe">
      <p>Unsafe render:</p>
      {input}
    </div>
  )
}

// SAFE — escaped with Bun.escapeHTML before passing to content
function safeRender(input: string): string {
  const escaped = Bun.escapeHTML(input)
  return (
    <div class="safe">
      <p>Safe render (Bun.escapeHTML applied):</p>
      {escaped}
    </div>
  )
}

// Attribute value IS escaped by typed-html
function attrSafeRender(input: string): string {
  // typed-html escapes & and " in attribute values automatically
  return (
    <div title={input} data-payload={input}>
      Attribute with payload (check rendered HTML source)
    </div>
  )
}

export function exp08(userInput: string): string {
  return (
    <html lang="en">
      <head><title>exp08 — XSS Probe</title></head>
      <body>
        <h1>exp08 — XSS Probe + Remediation</h1>

        <section>
          <h2>Input received</h2>
          <pre>{Bun.escapeHTML(userInput)}</pre>
        </section>

        <section>
          <h2>1. DANGEROUS: Raw content (no escape)</h2>
          <p>typed-html does NOT escape text content. The payload executes.</p>
          <div class="danger-box">
            {unsafeRender(userInput)}
          </div>
          <pre>Internal: contentsToString just joins strings — no sanitization</pre>
        </section>

        <section>
          <h2>2. SAFE: Bun.escapeHTML() applied</h2>
          {safeRender(userInput)}
          <pre>Bun.escapeHTML converts: &lt; &gt; &amp; &quot; into entities</pre>
        </section>

        <section>
          <h2>3. Attribute escaping (typed-html handles this)</h2>
          {attrSafeRender(userInput)}
          <p>Attribute values: &amp; → &amp;amp;, &quot; → &amp;quot; (typed-html escapes these)</p>
          <p>But: &lt; and &gt; are NOT escaped in attributes — partial protection only</p>
        </section>

        <section>
          <h2>4. Probe: XSS payload</h2>
          <p>Payload: <code>{Bun.escapeHTML(XSS_PAYLOAD)}</code></p>
          {safeRender(XSS_PAYLOAD)}
        </section>

        <section>
          <h2>5. Probe: HTML injection</h2>
          <p>Payload: <code>{Bun.escapeHTML(HTML_INJECTION)}</code></p>
          <p>Unsafe (HTML rendered):</p>
          {HTML_INJECTION}
          <p>Safe (escaped):</p>
          {Bun.escapeHTML(HTML_INJECTION)}
        </section>

        <section>
          <h2>Summary: Asymmetric escaping</h2>
          <table>
            <tr><th>Context</th><th>Escaped by typed-html?</th><th>Solution</th></tr>
            <tr><td>Attribute value</td><td>YES (&amp; &quot; nbsp)</td><td>typed-html handles</td></tr>
            <tr><td>Text content</td><td>NO</td><td>Bun.escapeHTML() before JSX</td></tr>
            <tr><td>Attribute &lt; &gt;</td><td>NO</td><td>Bun.escapeHTML() for untrusted URLs</td></tr>
          </table>
        </section>

        <section>
          <h2>Test other payloads</h2>
          <pre>{'curl "http://localhost:3002/exp08?input=<b>bold</b>"'}</pre>
          <pre>{'curl "http://localhost:3002/exp08?input=<img src=x onerror=alert(1)>"'}</pre>
        </section>
      </body>
    </html>
  )
}
