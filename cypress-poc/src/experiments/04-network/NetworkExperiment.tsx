import { useState } from 'react'
import { Section, Info, Pre, Row } from '../shared'

// ─── Components under test ────────────────────────────────────────────────────

export interface User {
  id: number
  name: string
  email: string
}

export function UserFetcher() {
  const [users, setUsers] = useState<User[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  const load = async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      setUsers(data)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div data-cy="user-fetcher">
      <button data-cy="load-btn" onClick={load}
        style={{ padding: '5px 12px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#c0c0c0', borderRadius: 3, fontSize: 12, marginBottom: 10 }}>
        Load Users
      </button>
      {status === 'loading' && <div data-cy="loading-spinner" style={{ color: '#ffa500', fontSize: 13 }}>Loading...</div>}
      {status === 'error' && <div data-cy="error-msg" role="alert" style={{ color: '#ff6b6b', fontSize: 13 }}>Failed to load users</div>}
      <ul data-cy="user-list" style={{ listStyle: 'none', marginTop: 8 }}>
        {users.map(u => (
          <li key={u.id} data-cy={`user-${u.id}`} style={{ padding: '4px 0', fontSize: 12, color: '#c0c0c0' }}>
            <span data-cy="user-name">{u.name}</span>
            <span style={{ color: '#555', marginLeft: 8 }}>{u.email}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PostForm() {
  const [title, setTitle] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [requestBody, setRequestBody] = useState('')

  const submit = async () => {
    const body = JSON.stringify({ title })
    setRequestBody(body)
    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    setSubmitted(true)
  }

  return (
    <div data-cy="post-form">
      <input data-cy="title-input" value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Post title..."
        style={{ background: '#111', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '5px 9px', borderRadius: 3, fontSize: 13, width: 200, outline: 'none' }}
      />
      <button data-cy="submit-btn" onClick={submit}
        style={{ marginLeft: 8, padding: '5px 12px', background: '#1a2a1a', border: '1px solid #2a5a2a', color: '#4caf50', borderRadius: 3, fontSize: 12 }}>
        Submit
      </button>
      {submitted && <div data-cy="success-msg" style={{ marginTop: 8, fontSize: 12, color: '#4caf50' }}>Posted!</div>}
      {requestBody && <div data-cy="request-body" style={{ marginTop: 4, fontSize: 11, color: '#555', fontFamily: 'monospace' }}>{requestBody}</div>}
    </div>
  )
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function InterceptSection() {
  return (
    <Section title="4.1 — cy.intercept(): stub network requests">
      <Info>cy.intercept() intercepts HTTP requests at the network layer — before they leave the browser.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <UserFetcher />
      </div>
      <Pre>{`// Stub with static body
cy.intercept('GET', '/api/users', [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob',   email: 'bob@example.com'   },
]).as('getUsers')

cy.get('[data-cy=load-btn]').click()
cy.wait('@getUsers')                           // wait for intercepted request
cy.get('[data-cy=user-list] li').should('have.length', 2)
cy.get('[data-cy=user-1] [data-cy=user-name]').should('have.text', 'Alice')`}</Pre>
    </Section>
  )
}

function AliasSection() {
  return (
    <Section title="4.2 — .as() + cy.wait(): waiting for requests">
      <Info>Name intercepts with .as() then cy.wait('@alias') blocks until that request fires.</Info>
      <Pre>{`cy.intercept('GET', '/api/users').as('getUsers')

cy.get('[data-cy=load-btn]').click()

// Wait returns the intercept object — inspect request/response
cy.wait('@getUsers').then(interception => {
  expect(interception.request.url).to.include('/api/users')
  expect(interception.response?.statusCode).to.eq(200)
})

// Wait multiple
cy.wait(['@getUsers', '@getSettings'])`}</Pre>
    </Section>
  )
}

function ErrorSection() {
  return (
    <Section title="4.3 — simulating errors and slow responses">
      <Info>Force server errors or slow responses to test error states and loading UI.</Info>
      <Pre>{`// 500 error
cy.intercept('GET', '/api/users', { statusCode: 500, body: { error: 'Server error' } })
cy.get('[data-cy=load-btn]').click()
cy.get('[data-cy=error-msg]').should('be.visible')

// Network failure
cy.intercept('GET', '/api/users', { forceNetworkError: true })

// Slow response (2s delay)
cy.intercept('GET', '/api/users', req => {
  req.reply(res => {
    res.setDelay(2000)
    res.send({ body: [] })
  })
})
cy.get('[data-cy=loading-spinner]').should('be.visible')`}</Pre>
    </Section>
  )
}

function SpySection() {
  return (
    <Section title="4.4 — spy without stubbing: verify real requests">
      <Info>Intercept without a response body to spy on requests without changing behavior.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <PostForm />
      </div>
      <Pre>{`// Spy on POST — don't stub the response
cy.intercept('POST', '/api/posts').as('createPost')

cy.get('[data-cy=title-input]').type('Hello World')
cy.get('[data-cy=submit-btn]').click()

cy.wait('@createPost').its('request.body').should('deep.equal', {
  title: 'Hello World',
})

// Verify request headers
cy.wait('@createPost').its('request.headers')
  .should('have.property', 'content-type')
  .and('include', 'application/json')`}</Pre>
    </Section>
  )
}

function FixtureSection() {
  return (
    <Section title="4.5 — cy.fixture(): load test data from files">
      <Info>Store mock data in cypress/fixtures/ and load with cy.fixture() to keep specs clean.</Info>
      <Pre>{`// cypress/fixtures/users.json
// [{ "id": 1, "name": "Alice", "email": "alice@example.com" }]

cy.fixture('users').then(users => {
  cy.intercept('GET', '/api/users', users).as('getUsers')
})

// Shorthand via intercept
cy.intercept('GET', '/api/users', { fixture: 'users' }).as('getUsers')

cy.get('[data-cy=load-btn]').click()
cy.wait('@getUsers')
cy.get('[data-cy=user-list] li').should('have.length', 1)`}</Pre>
    </Section>
  )
}

export default function NetworkExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>04 · Network</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        <code>cy.intercept()</code> is Cypress's network layer — it stubs, spies on, and delays HTTP
        requests at the browser level. Unlike mocking in unit tests, intercepts work with real fetch/XHR.
      </p>
      <InterceptSection />
      <AliasSection />
      <ErrorSection />
      <SpySection />
      <FixtureSection />
    </div>
  )
}
