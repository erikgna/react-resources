import { useEffect, useState } from 'react'
import { Section, Info, Pre } from '../shared'

// ─── Components under test ────────────────────────────────────────────────────

export interface User { id: number; name: string; email: string }

export function UserFeed() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/users')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<User[]>
      })
      .then(data => { setUsers(data); setLoading(false) })
      .catch((e: Error) => { setError(e.message); setLoading(false) })
  }, [])

  // Wrapper divs required: CT component locator scopes to INSIDE the root element,
  // so conditional root-level elements need a stable container.
  if (loading) return <div><div role="status">Loading users…</div></div>
  if (error) return <div><div role="alert" data-testid="error-msg">{error}</div></div>
  return (
    <div>
      <ul data-testid="user-list">
        {users.map(u => (
          <li key={u.id} data-testid={`user-${u.id}`}>
            <strong>{u.name}</strong> — {u.email}
          </li>
        ))}
      </ul>
    </div>
  )
}

export interface Post { title: string }

export function PostForm() {
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (!res.ok) throw new Error('Failed')
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="post-title">Post title</label>
      <input
        id="post-title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={{ marginLeft: 8, padding: '4px 8px', background: '#111', border: '1px solid #333', color: '#e0e0e0', borderRadius: 3 }}
      />
      <button type="submit" disabled={status === 'submitting'}
        style={{ marginLeft: 8, padding: '4px 10px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#c0c0c0', borderRadius: 3 }}>
        Publish
      </button>
      {status === 'submitting' && <span role="status" style={{ marginLeft: 8 }}>Saving…</span>}
      {status === 'done' && <span data-testid="success-msg" style={{ marginLeft: 8, color: '#4caf50' }}>Published!</span>}
      {status === 'error' && <span role="alert" style={{ marginLeft: 8, color: '#ff6b6b' }}>Error</span>}
    </form>
  )
}

// ─── 5.1 page.route() ─────────────────────────────────────────────────────────

function RouteSection() {
  return (
    <Section title="5.1 — page.route() to intercept and mock responses">
      <Info>
        page.route() intercepts fetch/XHR at the network layer — before the request leaves the browser.
        Only available in real-browser testing (Playwright), not jsdom (RTL).
      </Info>
      <div style={{ marginBottom: 10 }}>
        <UserFeed />
      </div>
      <Pre>{`test('mocks user list', async ({ mount, page }) => {
  // Intercept BEFORE mounting (route is registered on the page)
  await page.route('/api/users', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob',   email: 'bob@example.com' },
    ]),
  }))

  const component = await mount(<UserFeed />)
  await expect(component.getByTestId('user-list')).toBeVisible()
  await expect(component.getByText('Alice')).toBeVisible()
  await expect(component.getByText('Bob')).toBeVisible()
})`}</Pre>
    </Section>
  )
}

// ─── 5.2 Mocking error responses ─────────────────────────────────────────────

function ErrorSection() {
  return (
    <Section title="5.2 — Mocking error responses">
      <Info>Test error states by returning non-2xx status codes or aborting the request.</Info>
      <Pre>{`// HTTP error response:
await page.route('/api/users', route => route.fulfill({
  status: 500,
  body: 'Internal Server Error',
}))
const component = await mount(<UserFeed />)
await expect(component.getByRole('alert')).toContainText('HTTP 500')

// Network abort (simulates offline / CORS / DNS failure):
await page.route('/api/users', route => route.abort())
const component = await mount(<UserFeed />)
await expect(component.getByRole('alert')).toBeVisible()`}</Pre>
    </Section>
  )
}

// ─── 5.3 Inspecting request body ─────────────────────────────────────────────

function InspectSection() {
  return (
    <Section title="5.3 — Inspecting outgoing requests">
      <Info>Capture request details — method, headers, body — to assert what the component sends.</Info>
      <div style={{ marginBottom: 10 }}>
        <PostForm />
      </div>
      <Pre>{`test('POST sends correct body', async ({ mount, page }) => {
  let capturedBody: Record<string, unknown> | null = null

  await page.route('/api/posts', async route => {
    capturedBody = JSON.parse(route.request().postData() ?? '{}')
    await route.fulfill({ status: 201, body: '{}' })
  })

  const component = await mount(<PostForm />)
  await component.getByLabel('Post title').fill('My Post')
  await component.getByRole('button', { name: 'Publish' }).click()

  await expect(component.getByTestId('success-msg')).toBeVisible()
  expect(capturedBody).toEqual({ title: 'My Post' })
})`}</Pre>
    </Section>
  )
}

// ─── 5.4 waitForResponse ─────────────────────────────────────────────────────

function WaitForResponseSection() {
  return (
    <Section title="5.4 — page.waitForResponse() for assertion ordering">
      <Info>waitForResponse waits for a matching network response, useful for asserting response contents.</Info>
      <Pre>{`test('captures response', async ({ mount, page }) => {
  await page.route('/api/users', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: 1, name: 'Alice', email: 'a@b.com' }]),
  }))

  // Start waiting BEFORE the action that triggers the request:
  const responsePromise = page.waitForResponse('/api/users')
  const component = await mount(<UserFeed />)
  const response = await responsePromise

  expect(response.status()).toBe(200)
  const data = await response.json()
  expect(data).toHaveLength(1)

  await expect(component.getByText('Alice')).toBeVisible()
})`}</Pre>
    </Section>
  )
}

export default function NetworkExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>05 · Network</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Playwright intercepts the real network stack — fetch, XHR, WebSocket.
        This is a fundamental capability absent from RTL (jsdom has no network layer)
        and much more ergonomic than Cypress's <code>cy.intercept()</code>.
      </p>
      <RouteSection />
      <ErrorSection />
      <InspectSection />
      <WaitForResponseSection />
    </div>
  )
}
