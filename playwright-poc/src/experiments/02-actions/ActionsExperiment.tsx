import { useState } from 'react'
import { Section, Info, Pre, Row, Log } from '../shared'

// ─── Components under test ────────────────────────────────────────────────────

export function Counter() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <button aria-label="Decrement" onClick={() => setCount(c => c - 1)}>−</button>
      <span data-testid="count">{count}</span>
      <button aria-label="Increment" onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  )
}

export function TextForm({ onSubmit }: { onSubmit?: (v: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit?.(value) }}>
      <label htmlFor="text-input">Message</label>
      <input
        id="text-input"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Type here..."
        style={{ marginLeft: 8, padding: '4px 8px', background: '#111', border: '1px solid #333', color: '#e0e0e0', borderRadius: 3 }}
      />
      <button type="submit" style={{ marginLeft: 8, padding: '4px 10px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#c0c0c0', borderRadius: 3 }}>
        Submit
      </button>
      {value && <span data-testid="preview"> → {value}</span>}
    </form>
  )
}

export function SelectForm() {
  const [fruit, setFruit] = useState('apple')
  const [agreed, setAgreed] = useState(false)
  const [size, setSize] = useState('m')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <label htmlFor="fruit-select">Fruit: </label>
        <select id="fruit-select" value={fruit} onChange={e => setFruit(e.target.value)}
          style={{ background: '#111', border: '1px solid #333', color: '#e0e0e0', padding: '3px 6px', borderRadius: 3 }}>
          <option value="apple">Apple</option>
          <option value="banana">Banana</option>
          <option value="cherry">Cherry</option>
        </select>
        <span data-testid="fruit-display"> {fruit}</span>
      </div>
      <div>
        <label>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
          {' '}I agree
        </label>
        <span data-testid="agree-display"> {agreed ? 'yes' : 'no'}</span>
      </div>
      <div role="radiogroup" aria-label="Size">
        {['s', 'm', 'l'].map(s => (
          <label key={s} style={{ marginRight: 10 }}>
            <input type="radio" name="size" value={s} checked={size === s} onChange={() => setSize(s)} />
            {' '}{s.toUpperCase()}
          </label>
        ))}
        <span data-testid="size-display">{size}</span>
      </div>
    </div>
  )
}

export function HoverCard() {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ padding: '5px 12px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#c0c0c0', borderRadius: 3, fontSize: 12 }}
      >
        Hover me
      </button>
      {hovered && (
        <div role="tooltip" style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4,
          background: '#222', border: '1px solid #333', borderRadius: 3,
          padding: '4px 10px', fontSize: 12, color: '#aaa', whiteSpace: 'nowrap',
        }}>
          Tooltip content
        </div>
      )}
    </div>
  )
}

// ─── 2.1 click() ─────────────────────────────────────────────────────────────

function ClickSection() {
  const [log, setLog] = useState<string[]>([])
  const add = (msg: string) => setLog(l => [...l, msg])
  return (
    <Section title="2.1 — click() and actionability">
      <Info>
        click() auto-waits for actionability: element must be visible, stable (not animating),
        enabled, and not obscured. No manual waitFor needed.
      </Info>
      <Row style={{ marginBottom: 10 }}>
        <Counter />
      </Row>
      <Row>
        <button onClick={() => add('single click')} style={{ padding: '5px 12px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#c0c0c0', borderRadius: 3, fontSize: 12 }}>
          Single
        </button>
        <button onDoubleClick={() => add('double click')} style={{ padding: '5px 12px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#c0c0c0', borderRadius: 3, fontSize: 12 }}>
          Double
        </button>
      </Row>
      <Log entries={log} />
      <Pre>{`await component.getByRole('button', { name: 'Increment' }).click()
await expect(component.getByTestId('count')).toHaveText('1')

// click() options:
await btn.click({ button: 'right' })          // right-click
await btn.click({ modifiers: ['Shift'] })     // Shift+click
await btn.dblclick()                           // double-click
await btn.click({ position: { x: 10, y: 5 } }) // exact position`}</Pre>
    </Section>
  )
}

// ─── 2.2 fill() vs pressSequentially() ───────────────────────────────────────

function FillSection() {
  return (
    <Section title="2.2 — fill() vs pressSequentially()">
      <Info>fill() clears then sets value atomically. pressSequentially() dispatches real keydown/keypress/keyup events per character.</Info>
      <div style={{ marginBottom: 10 }}>
        <TextForm />
      </div>
      <Pre>{`// fill() — clears existing text, sets value, fires input + change events
await component.getByLabel('Message').fill('Hello world')
await expect(component.getByTestId('preview')).toContainText('Hello world')

// pressSequentially() — types one character at a time (tests debounce, IME)
await component.getByLabel('Message').pressSequentially('abc', { delay: 50 })

// clear() — just empties the field
await component.getByLabel('Message').clear()

// RTL equivalent:
// userEvent.type(input, 'text')       ≈ pressSequentially()
// fireEvent.change(input, { target: { value } })  ≈ fill()`}</Pre>
    </Section>
  )
}

// ─── 2.3 press() — keyboard ───────────────────────────────────────────────────

function PressSection() {
  return (
    <Section title="2.3 — press() for keyboard shortcuts">
      <Info>press() sends a single key or chord. Uses Playwright's key naming (e.g. 'Enter', 'Control+A').</Info>
      <Pre>{`// Single keys:
await input.press('Enter')           // submit form
await input.press('Escape')          // close modal
await input.press('Tab')             // move focus

// Key chords:
await input.press('Control+A')       // select all (Windows/Linux)
await input.press('Meta+A')          // select all (macOS)
await input.press('Shift+Tab')       // focus previous

// Key sequences via pressSequentially():
await input.pressSequentially('Hello{Enter}')  // NOT supported — use press() separately`}</Pre>
    </Section>
  )
}

// ─── 2.4 hover() ─────────────────────────────────────────────────────────────

function HoverSection() {
  return (
    <Section title="2.4 — hover() for pointer events">
      <Info>hover() moves pointer to element center (or given position). Triggers mouseenter/mousemove/mouseover.</Info>
      <div style={{ marginBottom: 10 }}>
        <HoverCard />
      </div>
      <Pre>{`await component.getByRole('button', { name: 'Hover me' }).hover()
await expect(component.getByRole('tooltip')).toBeVisible()
await expect(component.getByRole('tooltip')).toHaveText('Tooltip content')

// hover() with offset:
await element.hover({ position: { x: 5, y: 5 } })`}</Pre>
    </Section>
  )
}

// ─── 2.5 check() / selectOption() ────────────────────────────────────────────

function FormControlsSection() {
  return (
    <Section title="2.5 — check() / selectOption() for form controls">
      <Info>Semantic actions for checkboxes, radios, and selects. check() first verifies the element is a checkbox.</Info>
      <div style={{ marginBottom: 10 }}>
        <SelectForm />
      </div>
      <Pre>{`// select dropdown by value, label, or index:
await component.getByLabel('Fruit').selectOption('banana')
await component.getByLabel('Fruit').selectOption({ label: 'Cherry' })
await expect(component.getByTestId('fruit-display')).toHaveText('banana')

// checkbox:
await component.getByLabel('I agree').check()
await expect(component.getByLabel('I agree')).toBeChecked()
await component.getByLabel('I agree').uncheck()

// radio (click or check):
await component.getByRole('radio', { name: 'L' }).check()
await expect(component.getByTestId('size-display')).toHaveText('l')`}</Pre>
    </Section>
  )
}

export default function ActionsExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>02 · Actions</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Every Playwright action auto-waits for actionability before executing.
        No manual waits needed — Playwright checks visibility, stability, and enabled state.
      </p>
      <ClickSection />
      <FillSection />
      <PressSection />
      <HoverSection />
      <FormControlsSection />
    </div>
  )
}
