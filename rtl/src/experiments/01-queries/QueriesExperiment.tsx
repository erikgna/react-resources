import { Section, Row, Btn, Info, Pre } from '../shared'

// ─── Components under test ────────────────────────────────────────────────────
// These same components are imported in queries.test.tsx.

export function GreetingCard({ name, role }: { name: string; role: string }) {
  return (
    <div>
      <h2>Welcome, {name}</h2>
      <p data-testid="role-label">Role: {role}</p>
      <button aria-label="Close card">×</button>
      <img src="" alt="Profile photo" />
      <input placeholder="Search..." />
      <label htmlFor="email-input">Email</label>
      <input id="email-input" type="email" placeholder="you@example.com" />
    </div>
  )
}

export function StatusBadge({ status }: { status: 'active' | 'inactive' | 'pending' }) {
  const colors: Record<string, string> = { active: '#4caf50', inactive: '#666', pending: '#ffa500' }
  return (
    <span
      role="status"
      aria-label={`Status: ${status}`}
      style={{ color: colors[status], fontSize: 12 }}
    >
      {status}
    </span>
  )
}

// ─── 1.1 Query priority ───────────────────────────────────────────────────────

function QueryPriority() {
  return (
    <Section title="1.1 — Query priority: role > label > text > testId">
      <Info>RTL's query priority matches how users (and assistive tech) find elements. Use role first, testId last.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <GreetingCard name="Alice" role="Admin" />
      </div>
      <Pre>{`// Priority (highest → lowest)
screen.getByRole('heading', { name: /welcome/i })   // 1st: ARIA role
screen.getByLabelText('Email')                       // 2nd: label association
screen.getByPlaceholderText('Search...')             // 3rd: placeholder
screen.getByText('Role: Admin')                      // 4th: text content
screen.getByAltText('Profile photo')                 // 5th: alt text
screen.getByTestId('role-label')                     // Last resort

// Why: getByRole reflects the a11y tree — the same tree a screen reader uses.
// If your test uses getByTestId for everything, your markup may have a11y issues.`}</Pre>
    </Section>
  )
}

// ─── 1.2 getBy vs queryBy vs findBy ──────────────────────────────────────────

function QueryVariants() {
  return (
    <Section title="1.2 — getBy / queryBy / findBy">
      <Info>Three variants — each throws differently on missing elements.</Info>
      <Pre>{`// getBy*   — throws if 0 matches, throws if >1 match
//            Use when element MUST be present
const btn = screen.getByRole('button', { name: 'Submit' })

// queryBy* — returns null if 0 matches, throws if >1
//            Use to assert element is ABSENT
expect(screen.queryByText('Error')).toBeNull()

// findBy*  — returns Promise, retries until found or timeout
//            Use for async elements (data load, transition)
const item = await screen.findByText('Loaded item')

// getAllBy*  — throws if 0, returns array
// queryAllBy* — returns empty array if none
// findAllBy*  — async array version`}</Pre>
    </Section>
  )
}

// ─── 1.3 screen object vs destructured render ─────────────────────────────────

function ScreenVsDestructure() {
  return (
    <Section title="1.3 — screen object vs destructured render">
      <Info>Modern RTL prefers screen.* — queries are always bound to document.body, making them easier to use in helper functions.</Info>
      <Pre>{`// Old pattern — destructure from render
const { getByText, getByRole } = render(<MyComponent />)
getByText('Hello')    // works, but requires passing around

// Modern pattern — screen.*
import { render, screen } from '@testing-library/react'
render(<MyComponent />)
screen.getByText('Hello')   // always targets document.body

// Why screen is better:
// 1. No need to thread query functions through helpers
// 2. Works identically inside within() scopes
// 3. IDE autocompletion on screen.get... shows all variants`}</Pre>
    </Section>
  )
}

// ─── 1.4 within() — scoped queries ───────────────────────────────────────────

export function UserList() {
  return (
    <ul>
      <li data-testid="user-alice">
        <span>Alice</span>
        <button>Edit</button>
      </li>
      <li data-testid="user-bob">
        <span>Bob</span>
        <button>Edit</button>
      </li>
    </ul>
  )
}

function WithinSection() {
  return (
    <Section title="1.4 — within() for scoped queries">
      <Info>When multiple elements share the same text, scope queries to a container with within().</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <UserList />
      </div>
      <Pre>{`import { render, within } from '@testing-library/react'

render(<UserList />)

// Both rows have an "Edit" button — screen.getByRole('button', { name: 'Edit' }) throws
// because it finds 2 matches. Scope with within():
const aliceRow = screen.getByTestId('user-alice')
const editBtn  = within(aliceRow).getByRole('button', { name: 'Edit' })

// within() returns the same query API, scoped to a subtree.`}</Pre>
    </Section>
  )
}

// ─── 1.5 core reimplementation ───────────────────────────────────────────────

function CoreSection() {
  return (
    <Section title="1.5 — core/testing-lib.ts — hand-rolled render + getByText">
      <Info>The core reimplementation shows that getByText is a DOM walk — no magic. render() mounts into a detached div via createRoot.</Info>
      <Pre>{`// core/testing-lib.ts — simplified render()
export function render(ui: ReactElement): RenderResult {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  root.render(ui)                      // synchronous in test env
  return { container, ...buildQueries(container), ... }
}

// getByText — text walk, not querySelector
function walkForText(root: Element, text: string): Element | null {
  for (const child of Array.from(root.children)) {
    const found = walkForText(child, text)
    if (found) return found
  }
  if (hasText(root, text)) return root
  return null
}

// fireEvent.click — bubbles:true is critical
// React uses event delegation at root — non-bubbling events are ignored
element.dispatchEvent(new MouseEvent('click', { bubbles: true }))`}</Pre>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function QueriesExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>01 · Queries</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        RTL's query API is the foundation. Queries find DOM nodes the way users find them —
        by role, label, text — not by CSS class or implementation detail.
        Run <code>npm test</code> to see the corresponding tests pass.
      </p>
      <QueryPriority />
      <QueryVariants />
      <ScreenVsDestructure />
      <WithinSection />
      <CoreSection />
    </div>
  )
}
