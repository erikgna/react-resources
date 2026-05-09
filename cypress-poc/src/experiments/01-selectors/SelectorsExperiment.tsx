import { Section, Info, Pre, Row, Btn } from '../shared'
import { useState } from 'react'

// ─── Components under test ────────────────────────────────────────────────────
// These same components are targeted in cypress/e2e/01-selectors.cy.ts

export function UserCard({ name, role, status }: { name: string; role: string; status: 'active' | 'inactive' }) {
  return (
    <div data-cy="user-card" data-testid="user-card" style={{ padding: 12, background: '#0f0f0f', border: '1px solid #222', borderRadius: 4 }}>
      <h3 data-cy="user-name" style={{ fontSize: 14, color: '#e0e0e0', marginBottom: 4 }}>{name}</h3>
      <span data-cy="user-role" style={{ fontSize: 12, color: '#888' }}>{role}</span>
      <span
        data-cy="user-status"
        aria-label={`Status: ${status}`}
        style={{ marginLeft: 8, fontSize: 11, color: status === 'active' ? '#4caf50' : '#666' }}
      >
        {status}
      </span>
      <div style={{ marginTop: 8 }}>
        <button data-cy="edit-btn" aria-label={`Edit ${name}`} style={{ padding: '3px 8px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#c0c0c0', borderRadius: 3, fontSize: 11 }}>
          Edit
        </button>
        <button data-cy="delete-btn" aria-label={`Delete ${name}`} style={{ marginLeft: 6, padding: '3px 8px', background: '#2a1111', border: '1px solid #5a1111', color: '#ff6b6b', borderRadius: 3, fontSize: 11 }}>
          Delete
        </button>
      </div>
    </div>
  )
}

export function UserList() {
  return (
    <div data-cy="user-list">
      <UserCard name="Alice" role="Admin" status="active" />
      <div style={{ height: 8 }} />
      <UserCard name="Bob" role="Editor" status="inactive" />
      <div style={{ height: 8 }} />
      <UserCard name="Carol" role="Viewer" status="active" />
    </div>
  )
}

export function NavBar() {
  return (
    <nav data-cy="navbar" style={{ display: 'flex', gap: 16, padding: '8px 0', borderBottom: '1px solid #222', marginBottom: 12 }}>
      <a href="#" data-cy="nav-home" style={{ color: '#4a9eff', fontSize: 13, textDecoration: 'none' }}>Home</a>
      <a href="#" data-cy="nav-users" style={{ color: '#888', fontSize: 13, textDecoration: 'none' }}>Users</a>
      <a href="#" data-cy="nav-settings" style={{ color: '#888', fontSize: 13, textDecoration: 'none' }}>Settings</a>
    </nav>
  )
}

// ─── 1.1 data-cy attribute selectors ─────────────────────────────────────────

function DataCySection() {
  return (
    <Section title="1.1 — data-cy: the Cypress selector convention">
      <Info>
        Cypress recommends <code>data-cy</code> attributes over CSS classes, IDs, or text — they are purpose-built for testing and survive refactors.
      </Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <UserCard name="Alice" role="Admin" status="active" />
      </div>
      <Pre>{`// Prefer data-cy over everything else
cy.get('[data-cy=user-card]')              // direct attribute selector
cy.get('[data-cy=edit-btn]').click()        // action on specific element

// Why data-cy:
// - survives CSS class renames
// - survives text copy changes
// - invisible to users (no a11y impact)
// - grep-able: grep "data-cy=" lets you find all test targets`}</Pre>
    </Section>
  )
}

// ─── 1.2 CSS selectors ───────────────────────────────────────────────────────

function CssSelectorSection() {
  return (
    <Section title="1.2 — CSS selectors: cy.get() full power">
      <Info>cy.get() accepts any valid CSS selector. Use sparingly — prefer data-cy for stability.</Info>
      <Pre>{`// Tag
cy.get('button')                           // all buttons
cy.get('nav a')                            // anchor inside nav

// Attribute
cy.get('[aria-label="Edit Alice"]')        // aria-label
cy.get('[data-testid=user-card]')          // data-testid (RTL convention)

// Pseudo
cy.get('button:first')                     // first button
cy.get('button:contains("Delete")')        // button with text (jQuery-style)

// Chained
cy.get('[data-cy=user-list]').find('[data-cy=user-card]').first()`}</Pre>
    </Section>
  )
}

// ─── 1.3 cy.contains ─────────────────────────────────────────────────────────

function ContainsSection() {
  const [msg, setMsg] = useState('')
  return (
    <Section title="1.3 — cy.contains(): text-based selection">
      <Info>cy.contains() finds elements by text content — useful for labels, headings, buttons.</Info>
      <Row style={{ marginBottom: 10 }}>
        <button data-cy="confirm-btn" onClick={() => setMsg('confirmed')} style={{ padding: '5px 12px', background: '#1a2a1a', border: '1px solid #2a5a2a', color: '#4caf50', borderRadius: 3, fontSize: 12 }}>Confirm</button>
        <button data-cy="cancel-btn" onClick={() => setMsg('cancelled')} style={{ padding: '5px 12px', background: '#2a1111', border: '1px solid #5a1111', color: '#ff6b6b', borderRadius: 3, fontSize: 12 }}>Cancel</button>
        {msg && <span data-cy="result" style={{ fontSize: 12, color: '#888' }}>{msg}</span>}
      </Row>
      <Pre>{`// by text string
cy.contains('Confirm').click()
cy.contains('Cancel')

// scoped to element type
cy.contains('button', 'Confirm').click()

// regex
cy.contains(/confirm/i)

// chained (within scope)
cy.get('[data-cy=navbar]').contains('Users')`}</Pre>
    </Section>
  )
}

// ─── 1.4 within() ────────────────────────────────────────────────────────────

function WithinSection() {
  return (
    <Section title="1.4 — .within(): scoped queries">
      <Info>Scope commands to a subtree when multiple elements share the same selector.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <UserList />
      </div>
      <Pre>{`// Both Bob and Alice rows have [data-cy=edit-btn]
// Without scoping: cy.get('[data-cy=edit-btn]') returns 3 elements

cy.get('[data-cy=user-list]')
  .find('[data-cy=user-card]').first()     // Alice's card
  .within(() => {
    cy.get('[data-cy=edit-btn]').click()   // scoped to Alice's card only
  })

// Or use .eq() to index into matched set
cy.get('[data-cy=edit-btn]').eq(1).click() // Bob's Edit button (0-indexed)`}</Pre>
    </Section>
  )
}

// ─── 1.5 selector hierarchy ──────────────────────────────────────────────────

function HierarchySection() {
  return (
    <Section title="1.5 — Selector priority (best → fragile)">
      <Pre>{`// 1. data-cy attribute (Cypress convention)
cy.get('[data-cy=submit-btn]')

// 2. Accessible name / ARIA (a11y-first)
cy.get('[aria-label="Save changes"]')

// 3. data-testid (RTL convention — also stable)
cy.get('[data-testid=error-msg]')

// 4. Text content via cy.contains()
cy.contains('Submit')

// 5. CSS class (fragile — renames break tests)
cy.get('.btn-primary')

// 6. nth-child / positional (most fragile)
cy.get('table tr:nth-child(3) td:first-child')`}</Pre>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function SelectorsExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>01 · Selectors</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Cypress selectors are the foundation. <code>cy.get()</code> accepts CSS selectors;
        <code>cy.contains()</code> matches text. The <code>data-cy</code> convention isolates
        test targets from style and copy changes. Run <code>npm run cy:open</code> to see specs.
      </p>
      <DataCySection />
      <CssSelectorSection />
      <ContainsSection />
      <WithinSection />
      <HierarchySection />
    </div>
  )
}
