import { useState, useEffect } from 'react'
import { Section, Info, Pre } from '../shared'

// ─── Components that exhibit failure patterns ─────────────────────────────────

export function ActWarningComponent({ onMount }: { onMount?: () => void }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    // Simulates external subscription (WebSocket, EventEmitter)
    // triggering state update outside React's control
    const id = setTimeout(() => {
      setCount(1)
      onMount?.()
    }, 0)
    return () => clearTimeout(id)
  }, [onMount])
  return <div data-testid="count">{count}</div>
}

export function StaleQueryComponent() {
  const [show, setShow] = useState(true)
  return (
    <div>
      <button onClick={() => setShow(false)} aria-label="hide">Hide element</button>
      {show && <span data-testid="target">I will disappear</span>}
    </div>
  )
}

export function AsyncFalsePositive({ fetcher }: { fetcher: () => Promise<string> }) {
  const [data, setData] = useState<string | null>(null)
  useEffect(() => {
    fetcher().then(setData)
  }, [fetcher])
  return <div>{data && <p data-testid="result">{data}</p>}</div>
}

export function ImplementationDetailTrap() {
  const [internal, setInternal] = useState({ counter: 0, hidden: 'secret' })
  return (
    <div>
      <p data-testid="display">{internal.counter}</p>
      <button onClick={() => setInternal(s => ({ ...s, counter: s.counter + 1 }))}>
        Add
      </button>
    </div>
  )
}

export function DoubleRenderTrap() {
  const [items, setItems] = useState<string[]>([])
  return (
    <div>
      <button onClick={() => setItems(prev => [...prev, `item-${prev.length + 1}`])}>
        Add Item
      </button>
      <ul>
        {items.map(item => <li key={item}>{item}</li>)}
      </ul>
      <span data-testid="count">{items.length}</span>
    </div>
  )
}

// ─── 8.1 act() warning ────────────────────────────────────────────────────────

function ActWarningSection() {
  return (
    <Section title="8.1 — act() warning — what causes it">
      <Info>The act() warning fires when a state update happens outside React's event system and tests don't wait for it. The fix is always to make the test wait, not to suppress the warning.</Info>
      <Pre>{`// BROKEN: state update (setTimeout callback) fires after assertion
it('broken — misses async state update', () => {
  render(<ActWarningComponent />)
  // Warning: "An update to ActWarningComponent inside a test was not wrapped in act(...)"
  expect(screen.getByTestId('count')).toHaveTextContent('0')
  // Test passes, but only because we checked before the timeout fired
})

// FIXED: wait for the update
it('fixed — uses findBy to wait', async () => {
  render(<ActWarningComponent />)
  // findBy polls until the element has text '1', or times out
  const el = await screen.findByTestId('count')
  expect(el).toHaveTextContent('1')
})

// Alternative fix: wrap the timer advance in act()
act(() => { vi.advanceTimersByTime(0) })
expect(screen.getByTestId('count')).toHaveTextContent('1')`}</Pre>
    </Section>
  )
}

// ─── 8.2 Stale query ──────────────────────────────────────────────────────────

function StaleQuerySection() {
  return (
    <Section title="8.2 — Stale getBy* after DOM mutation">
      <Info>getBy* returns the CURRENT DOM node at query time. If you cache the result and the node is replaced/removed, the reference goes stale.</Info>
      <Pre>{`// BROKEN: cache the element, then trigger removal
it('broken — stale reference', async () => {
  const user = userEvent.setup()
  render(<StaleQueryComponent />)

  // Cache the reference
  const target = screen.getByTestId('target')

  await user.click(screen.getByRole('button', { name: 'hide' }))

  // 'target' is detached from DOM but still referenced in memory
  // This assertion may not throw because the node object still has textContent
  expect(target).not.toBeInTheDocument()  // ← this actually works
  // BUT: target.click() would silently do nothing — stale reference bug
})

// FIXED: query AFTER the mutation
it('fixed — re-query after mutation', async () => {
  const user = userEvent.setup()
  render(<StaleQueryComponent />)

  await user.click(screen.getByRole('button', { name: 'hide' }))
  expect(screen.queryByTestId('target')).not.toBeInTheDocument()
})`}</Pre>
    </Section>
  )
}

// ─── 8.3 Testing implementation details ───────────────────────────────────────

function ImplementationDetailSection() {
  return (
    <Section title="8.3 — Testing implementation details (anti-pattern)">
      <Info>Testing internal state directly couples tests to implementation. Refactoring the internals breaks the test even if behavior is unchanged.</Info>
      <Pre>{`// ANTI-PATTERN: Accessing internal state via component instance or enzyme-style
// These patterns don't exist in RTL by design — you can't do wrapper.state()

// ANTI-PATTERN: Querying by CSS class or internal structure
screen.getByClassName('btn-primary')        // class is an implementation detail
container.querySelector('.MuiButton-root')  // library internals

// ANTI-PATTERN: Checking internal state object
expect(result.current.internal.hidden).toBe('secret')  // exposes internals

// CORRECT: Test observable behavior — what the user sees
screen.getByRole('button', { name: 'Add' })     // semantics, not class
screen.getByTestId('display')                    // stable, explicit contract
expect(display).toHaveTextContent('1')          // output, not state shape

// Rule: if renaming a CSS class or restructuring state breaks your test,
// you're testing implementation details.`}</Pre>
    </Section>
  )
}

// ─── 8.4 False positives ─────────────────────────────────────────────────────

function FalsePositivesSection() {
  return (
    <Section title="8.4 — Async tests that pass when they should fail">
      <Info>A common mistake: asserting absence of an element before it's had a chance to appear. The test passes because the async operation hasn't run yet.</Info>
      <Pre>{`// FALSE POSITIVE — passes for the wrong reason
it('broken — checks for absence too early', async () => {
  const fetcher = () => new Promise(resolve => setTimeout(() => resolve('data'), 100))
  render(<AsyncFalsePositive fetcher={fetcher} />)

  // At this point, the fetch hasn't resolved — result doesn't exist yet
  // This passes, but not because the component is correct — it just hasn't loaded
  expect(screen.queryByTestId('result')).not.toBeInTheDocument()
})

// CORRECT — wait long enough, then assert
it('fixed — wait for load to complete first', async () => {
  const fetcher = () => Promise.resolve('loaded data')
  render(<AsyncFalsePositive fetcher={fetcher} />)

  // First verify the data DID load
  await screen.findByTestId('result')

  // THEN verify the thing you want to be absent is absent
  expect(screen.queryByTestId('error')).not.toBeInTheDocument()
})`}</Pre>
    </Section>
  )
}

// ─── 8.5 Cleanup and isolation leaks ─────────────────────────────────────────

function CleanupSection() {
  return (
    <Section title="8.5 — cleanup() and test isolation">
      <Info>RTL auto-calls cleanup() after each test (via afterEach). With vitest globals, this is wired automatically. Without it, rendered components persist across tests and cause false positives.</Info>
      <Pre>{`// RTL's cleanup removes:
// 1. The container div from document.body
// 2. Calls ReactDOM.unmountComponentAtRoot on the container

// With vitest globals: true — afterEach cleanup is automatic
// Without it, you'd get:
//   "Found multiple elements with role 'button'" errors
//   Because prior test's DOM is still mounted

// To verify cleanup is working:
it('first test renders button', () => {
  render(<button>Click me</button>)
  expect(screen.getAllByRole('button')).toHaveLength(1)
})

it('second test has clean DOM', () => {
  render(<button>Click me</button>)
  // If cleanup didn't run, this would find 2 buttons
  expect(screen.getAllByRole('button')).toHaveLength(1)
})`}</Pre>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function FailuresExperiment() {
  const [showFix, setShowFix] = useState(false)
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>08 · Failures</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
        The most common RTL pitfalls: act() warnings, stale references, testing implementation
        details, false positives, and cleanup leaks. The test file demonstrates each broken
        pattern and the correct fix side-by-side.
      </p>
      <div style={{ marginBottom: 14 }}>
        <button
          onClick={() => setShowFix(v => !v)}
          style={{
            padding: '5px 12px', background: '#1a2a1a', border: '1px solid #2a4a2a',
            color: '#4caf50', borderRadius: 3, fontSize: 12,
          }}
        >
          {showFix ? 'Show broken patterns' : 'Show fix patterns'}
        </button>
      </div>
      {showFix ? (
        <>
          <ActWarningSection />
          <StaleQuerySection />
          <ImplementationDetailSection />
          <FalsePositivesSection />
          <CleanupSection />
        </>
      ) : (
        <>
          <ActWarningSection />
          <StaleQuerySection />
          <ImplementationDetailSection />
          <FalsePositivesSection />
          <CleanupSection />
        </>
      )}
    </div>
  )
}
