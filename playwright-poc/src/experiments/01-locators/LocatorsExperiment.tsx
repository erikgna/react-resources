import { useState } from 'react'
import { Section, Info, Pre } from '../shared'

// ─── Components under test ────────────────────────────────────────────────────

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

export function ProductList() {
  const products = ['Apple', 'Banana', 'Cherry']
  return (
    <ul role="list">
      {products.map(name => (
        <li key={name} role="listitem">
          <span>{name}</span>
          <button>Add to cart</button>
        </li>
      ))}
    </ul>
  )
}

// ─── 1.1 Locator priority ─────────────────────────────────────────────────────

function LocatorPriority() {
  return (
    <Section title="1.1 — Locator priority: role > label > text > testId">
      <Info>Playwright mirrors RTL's priority. getByRole queries the ARIA tree — same interface a screen reader uses.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <GreetingCard name="Alice" role="Admin" />
      </div>
      <Pre>{`// Priority (highest → lowest)
component.getByRole('heading', { name: /welcome/i })     // 1st: ARIA role
component.getByLabel('Email')                             // 2nd: label association
component.getByPlaceholder('Search...')                   // 3rd: placeholder
component.getByText('Role: Admin')                        // 4th: text content
component.getByAltText('Profile photo')                   // 5th: alt text
component.getByTestId('role-label')                       // Last resort`}</Pre>
    </Section>
  )
}

// ─── 1.2 Locator is lazy ─────────────────────────────────────────────────────

function LazyLocators() {
  const [show, setShow] = useState(false)
  return (
    <Section title="1.2 — Locator is a lazy retrying reference (not a DOM element)">
      <Info>
        Key shift from RTL: a Locator does not resolve immediately.
        It re-evaluates on every action and assertion, enabling auto-waiting.
      </Info>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button
          onClick={() => setShow(v => !v)}
          style={{ padding: '5px 12px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#c0c0c0', borderRadius: 3, fontSize: 12 }}
        >
          Toggle element
        </button>
        {show && <span data-testid="lazy-target">Now visible</span>}
      </div>
      <Pre>{`// RTL: getByText() returns a DOM element — throws immediately if absent
const el = screen.getByText('Hello')   // Error thrown NOW if missing

// Playwright: getByText() returns a Locator — no error yet
const loc = component.getByText('Hello')  // no evaluation yet

// Evaluation happens at action/assertion time with automatic retrying:
await loc.click()                    // retries until element is clickable
await expect(loc).toBeVisible()      // retries until visible (or timeout)

// This means you can assign locators before the element exists:
const result = component.getByTestId('lazy-target')  // ok even if hidden
await toggle.click()
await expect(result).toBeVisible()   // waits up to 5s by default`}</Pre>
    </Section>
  )
}

// ─── 1.3 Chaining ────────────────────────────────────────────────────────────

function ChainingLocators() {
  return (
    <Section title="1.3 — Chaining locators (equivalent to RTL within())">
      <Info>Chain locator methods to scope queries to a subtree. Playwright enforces strict mode — getByRole throws if it finds multiple matches.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <UserList />
      </div>
      <Pre>{`// Both rows have an "Edit" button.
// getByRole('button', { name: 'Edit' }) would THROW — strict mode, 2 matches.

// Option A: chain from a unique parent
const aliceRow = component.getByTestId('user-alice')
await aliceRow.getByRole('button', { name: 'Edit' }).click()

// Option B: filter() on a multi-match locator (see 1.4)
const aliceEdit = component.getByRole('listitem')
  .filter({ has: component.getByText('Alice') })
  .getByRole('button', { name: 'Edit' })
await aliceEdit.click()

// RTL equivalent: within(aliceRow).getByRole('button', { name: 'Edit' })`}</Pre>
    </Section>
  )
}

// ─── 1.4 filter() ────────────────────────────────────────────────────────────

function FilterSection() {
  return (
    <Section title="1.4 — filter() for content-based disambiguation">
      <Info>filter() narrows a multi-match locator without needing a unique data-testid. Best for dynamic lists.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <ProductList />
      </div>
      <Pre>{`// Three rows, each with "Add to cart". Targeting Banana specifically:
const bananaRow = component.getByRole('listitem')
  .filter({ hasText: 'Banana' })

await expect(bananaRow).toHaveCount(1)
await bananaRow.getByRole('button', { name: 'Add to cart' }).click()

// filter() by locator presence:
const activeRow = component.getByRole('listitem')
  .filter({ has: component.locator('.is-active') })

// filter() chains are composable — each filter() narrows further:
component.getByRole('listitem')
  .filter({ hasText: /Banana/i })
  .filter({ has: component.locator('[data-available]') })`}</Pre>
    </Section>
  )
}

// ─── 1.5 nth / first / last ──────────────────────────────────────────────────

function NthSection() {
  return (
    <Section title="1.5 — first() / last() / nth(n)">
      <Info>Index-based selection. Prefer filter() when content is available — nth() breaks if list order changes.</Info>
      <Pre>{`const items = component.getByRole('listitem')

await expect(items).toHaveCount(3)   // assert length before indexing
await items.first().click()          // 1st match
await items.last().click()           // last match
await items.nth(1).click()           // 0-indexed → 2nd item

// Combine with chaining:
await items.nth(2).getByRole('button').click()`}</Pre>
    </Section>
  )
}

export default function LocatorsExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>01 · Locators</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Playwright Locators are lazy, retrying references — not DOM elements. They re-evaluate on
        every action and assertion, enabling auto-waiting without manual <code>waitFor</code>.
        Run <code>npm run test-ct</code> to see the corresponding tests pass.
      </p>
      <LocatorPriority />
      <LazyLocators />
      <ChainingLocators />
      <FilterSection />
      <NthSection />
    </div>
  )
}
