// exp07 — Form + POST Handling
// GET: renders form page with typed-html
// POST: Hono parses FormData, typed-html renders result
// Uses HTML-spec attrs: for=, not htmlFor=
import * as elements from 'typed-html'

export function exp07Get(): string {
  return (
    <html lang="en">
      <head><title>exp07 — Form</title></head>
      <body>
        <h1>exp07 — Form + POST Handling</h1>
        <p>Submit this form via POST to /exp07</p>

        <form method="post" action="/exp07">
          <div>
            <label for="name">Your name:</label>
            <input id="name" name="name" type="text" required="required" placeholder="Enter name" />
          </div>
          <div>
            <label for="email">Email:</label>
            <input id="email" name="email" type="email" placeholder="Enter email" />
          </div>
          <div>
            <label for="role">Role:</label>
            <select id="role" name="role">
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="guest">Guest</option>
            </select>
          </div>
          <div>
            <label>
              <input type="checkbox" name="subscribe" value="yes" />
              Subscribe to newsletter
            </label>
          </div>
          <button type="submit">Submit</button>
        </form>

        <hr />
        <h2>Test with curl:</h2>
        <pre>{'curl -X POST http://localhost:3002/exp07 \\\n  -d "name=Alice&email=alice@example.com&role=admin"'}</pre>
        <pre>{'curl -X POST http://localhost:3002/exp07 \\\n  -d "name=<script>alert(1)</script>"'}</pre>
      </body>
    </html>
  )
}

export function exp07Post(name: string): string {
  const safe = Bun.escapeHTML(name)
  const now = new Date()
  return (
    <html lang="en">
      <head><title>exp07 — Form Result</title></head>
      <body>
        <h1>Form submitted</h1>
        <p>Name received: <strong>{safe}</strong></p>
        <p>Processed at: <time datetime={now}>{now.toISOString()}</time></p>
        <p>
          Name passed through <code>Bun.escapeHTML()</code> before rendering.
          typed-html does NOT escape content — caller owns safety.
        </p>
        <a href="/exp07">Back to form</a>
      </body>
    </html>
  )
}
