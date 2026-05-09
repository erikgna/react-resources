import { useEffect, useState } from 'react'
import { Section, Info, Pre } from '../shared'

// ─── Components under test ────────────────────────────────────────────────────

export function DelayedContent({ delayMs = 300 }: { delayMs?: number }) {
  const [loaded, setLoaded] = useState(false)
  const [data, setData] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setLoaded(true)
      setData('Loaded item')
    }, delayMs)
    return () => clearTimeout(t)
  }, [delayMs])

  return (
    <div>
      {!loaded && <div role="status" aria-label="Loading">Loading...</div>}
      {loaded && <div data-testid="result">{data}</div>}
    </div>
  )
}

export function SearchDebounce({ debounceMs = 300 }: { debounceMs?: number }) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState('')

  useEffect(() => {
    if (!query) { setResult(''); return }
    const t = setTimeout(() => setResult(`Results for: ${query}`), debounceMs)
    return () => clearTimeout(t)
  }, [query, debounceMs])

  return (
    <div>
      <label htmlFor="search-input">Search</label>
      <input
        id="search-input"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Type to search..."
        style={{ marginLeft: 8, padding: '4px 8px', background: '#111', border: '1px solid #333', color: '#e0e0e0', borderRadius: 3 }}
      />
      {result && <div data-testid="search-result" style={{ marginTop: 8, fontSize: 13, color: '#aaa' }}>{result}</div>}
    </div>
  )
}

export function StepLoader() {
  const [step, setStep] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const start = () => {
    setStep('loading')
    setTimeout(() => setStep('done'), 400)
  }

  return (
    <div>
      <button onClick={start} disabled={step !== 'idle'}
        style={{ padding: '5px 12px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: step === 'idle' ? '#c0c0c0' : '#555', borderRadius: 3, fontSize: 12 }}>
        Start
      </button>
      {step === 'loading' && <span role="status" style={{ marginLeft: 8, color: '#ffa500' }}>Loading…</span>}
      {step === 'done' && <span data-testid="done-indicator" style={{ marginLeft: 8, color: '#4caf50' }}>Done!</span>}
    </div>
  )
}

// ─── 4.1 Auto-waiting ─────────────────────────────────────────────────────────

function AutoWaitSection() {
  return (
    <Section title="4.1 — Auto-waiting: no manual waitFor needed">
      <Info>
        Playwright waits automatically. expect().toBeVisible() retries until visible or timeout.
        click() waits until element is actionable. This is the biggest UX win over RTL.
      </Info>
      <div style={{ marginBottom: 10 }}>
        <DelayedContent />
      </div>
      <Pre>{`// RTL — you must explicit waitFor async state:
const item = await waitFor(() => screen.getByTestId('result'))
expect(item).toHaveTextContent('Loaded item')

// Playwright CT — assertion retries until condition met:
const component = await mount(<DelayedContent />)

// No waitFor() — expect retries automatically up to default 5s timeout:
await expect(component.getByTestId('result')).toBeVisible()
await expect(component.getByTestId('result')).toHaveText('Loaded item')

// The loading spinner disappears — no explicit wait needed:
await expect(component.getByRole('status')).not.toBeVisible()`}</Pre>
    </Section>
  )
}

// ─── 4.2 Loading state transitions ───────────────────────────────────────────

function LoadingTransitionSection() {
  return (
    <Section title="4.2 — Loading → Done state transition">
      <Info>Assert intermediate states — loading spinner visible, then gone, then result appears.</Info>
      <div style={{ marginBottom: 10 }}>
        <StepLoader />
      </div>
      <Pre>{`const component = await mount(<StepLoader />)

await component.getByRole('button', { name: 'Start' }).click()

// Loading state — may be brief, but Playwright catches it:
await expect(component.getByRole('status')).toBeVisible()

// Final state — auto-waits for loading to finish:
await expect(component.getByTestId('done-indicator')).toBeVisible()
await expect(component.getByRole('status')).not.toBeVisible()

// Button disabled during loading:
await expect(component.getByRole('button', { name: 'Start' })).toBeDisabled()`}</Pre>
    </Section>
  )
}

// ─── 4.3 Debounced input ─────────────────────────────────────────────────────

function DebounceSection() {
  return (
    <Section title="4.3 — Debounced input — waitFor custom condition">
      <Info>Debounced updates require waiting beyond the debounce window. Use locator.waitFor() for explicit conditions.</Info>
      <div style={{ marginBottom: 10 }}>
        <SearchDebounce />
      </div>
      <Pre>{`const component = await mount(<SearchDebounce />)

await component.getByLabel('Search').fill('react')

// Result appears after 300ms debounce — auto-wait handles it:
await expect(component.getByTestId('search-result'))
  .toHaveText('Results for: react')

// Explicit locator.waitFor() — useful when you want to control timeout:
await component.getByTestId('search-result').waitFor({ state: 'visible', timeout: 1000 })

// waitFor({ state }) options: 'attached' | 'detached' | 'visible' | 'hidden'`}</Pre>
    </Section>
  )
}

// ─── 4.4 Custom timeouts ─────────────────────────────────────────────────────

function TimeoutSection() {
  return (
    <Section title="4.4 — Custom timeouts per assertion">
      <Info>Override the default 5s timeout per assertion. Useful for known-slow operations or fast-failing tests.</Info>
      <Pre>{`// Per-assertion timeout (ms):
await expect(component.getByTestId('result'))
  .toBeVisible({ timeout: 2000 })           // fail after 2s instead of 5s

// Short timeout for elements that should appear fast:
await expect(component.getByRole('button'))
  .toBeEnabled({ timeout: 500 })

// locator.waitFor() with timeout:
await component.getByTestId('result').waitFor({
  state: 'visible',
  timeout: 3000,
})

// Global timeout configured in playwright-ct.config.ts:
// use: { actionTimeout: 10_000, expect: { timeout: 5000 } }`}</Pre>
    </Section>
  )
}

export default function AsyncExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>04 · Async</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Playwright's auto-waiting model eliminates most explicit <code>waitFor</code> calls.
        Every action waits for actionability; every assertion retries until satisfied.
        This is a fundamental architectural difference from RTL.
      </p>
      <AutoWaitSection />
      <LoadingTransitionSection />
      <DebounceSection />
      <TimeoutSection />
    </div>
  )
}
