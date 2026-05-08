import { useRef, useState, memo } from 'react'
import { Section, Info, Pre } from '../shared'

// ─── Components under test ────────────────────────────────────────────────────

export function RenderCounter({ label }: { label: string }) {
  const count = useRef(0)
  count.current++
  return (
    <div>
      <span data-testid={`label-${label}`}>{label}</span>
      <span data-testid={`renders-${label}`}>{count.current}</span>
    </div>
  )
}

type Item = { id: number; name: string; active: boolean }

export function ItemList({ items, onToggle }: { items: Item[]; onToggle: (id: number) => void }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id} data-testid={`item-${item.id}`}>
          <span>{item.name}</span>
          <button onClick={() => onToggle(item.id)} aria-label={`Toggle ${item.name}`}>
            {item.active ? 'Deactivate' : 'Activate'}
          </button>
        </li>
      ))}
    </ul>
  )
}

export const MemoizedItem = memo(function MemoizedItem({
  item, onToggle,
}: { item: Item; onToggle: (id: number) => void }) {
  const renders = useRef(0)
  renders.current++
  return (
    <li data-testid={`memo-item-${item.id}`} data-renders={renders.current}>
      {item.name} — renders: {renders.current}
      <button onClick={() => onToggle(item.id)}>Toggle</button>
    </li>
  )
})

export function TabPanel({ tabs }: { tabs: string[] }) {
  const [active, setActive] = useState(0)
  return (
    <div>
      <div role="tablist">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            role="tab"
            aria-selected={active === i}
            onClick={() => setActive(i)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div role="tabpanel" data-testid="active-panel">
        {tabs[active]} content
      </div>
    </div>
  )
}

// ─── 7.1 Snapshot vs behavioral assertions ────────────────────────────────────

function SnapshotVsBehaviorSection() {
  return (
    <Section title="7.1 — Snapshot vs behavioral assertions">
      <Info>Snapshots catch accidental output changes. Behavioral assertions verify intent. For most components, behavioral tests have a better signal-to-noise ratio.</Info>
      <Pre>{`// Snapshot — brittle, fails on any markup change (className rename, etc.)
expect(container.firstChild).toMatchSnapshot()

// Behavioral — asserts what the user observes, not how it's implemented
expect(screen.getByRole('heading')).toHaveTextContent('Dashboard')
expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
expect(screen.getByLabelText('Email')).toHaveValue('alice@example.com')

// toMatchSnapshot() is useful for:
// 1. Detecting unintended structural changes in stable, rarely-edited components
// 2. Verifying serialized output (JSON, SVG, error messages)
// NOT useful for: components that change frequently or have dynamic content`}</Pre>
    </Section>
  )
}

// ─── 7.2 Render count tracking ────────────────────────────────────────────────

function RenderCountSection() {
  return (
    <Section title="7.2 — Render count tracking">
      <Pre>{`// Track renders via a useRef counter in the component under test
function RenderCounter({ label }) {
  const count = useRef(0)
  count.current++
  return <span data-testid={\`renders-\${label}\`}>{count.current}</span>
}

// Assert in tests
render(<RenderCounter label="foo" />)
const counter = screen.getByTestId('renders-foo')
expect(counter).toHaveTextContent('1')  // initial render

// After state update that should NOT affect this component:
act(() => { setState('other-state') })
expect(counter).toHaveTextContent('1')  // still 1 — no wasted render`}</Pre>
    </Section>
  )
}

// ─── 7.3 within() for complex UIs ────────────────────────────────────────────

function WithinForComplexUISection() {
  return (
    <Section title="7.3 — within() prevents query pollution in large UIs">
      <Info>In tests with large rendered trees, scoping queries to specific containers prevents accidental matches and speeds up lookups.</Info>
      <Pre>{`render(<ItemList items={manyItems} onToggle={vi.fn()} />)

// Without within(): getByText('Activate') might match multiple items
// With within(): scoped to exact row
const row = screen.getByTestId('item-1')
const btn = within(row).getByRole('button')
expect(btn).toHaveTextContent('Activate')

// Corollary: don't scope when you mean to check global state
// screen.getByRole('alert') should check the whole document — not within(dialog)`}</Pre>
    </Section>
  )
}

// ─── 7.4 Live demo ───────────────────────────────────────────────────────────

function LiveDemoSection() {
  return (
    <Section title="7.4 — TabPanel live demo">
      <Info>The TabPanel component is tested for correct tab switching behavior, not DOM structure.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14 }}>
        <TabPanel tabs={['Overview', 'Details', 'Settings']} />
      </div>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function PerformanceExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>07 · Performance</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        RTL tests verify behavior, not implementation. Render counts, within() scoping,
        and behavioral vs snapshot assertions are the key tools for writing fast, non-brittle tests.
      </p>
      <SnapshotVsBehaviorSection />
      <RenderCountSection />
      <WithinForComplexUISection />
      <LiveDemoSection />
    </div>
  )
}
