import { useState, useRef } from 'react'
import { Section, Info, Pre } from '../shared'

// ─── Components under test ────────────────────────────────────────────────────

export function Counter() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <button onClick={() => setCount(c => c - 1)} aria-label="Decrement">−</button>
      <span data-testid="count">{count}</span>
      <button onClick={() => setCount(c => c + 1)} aria-label="Increment">+</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  )
}

export function TextInput() {
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState('')
  return (
    <form onSubmit={e => { e.preventDefault(); setSubmitted(value) }}>
      <label htmlFor="message">Message</label>
      <input
        id="message"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Type here..."
      />
      <button type="submit">Send</button>
      {submitted && <p data-testid="submitted-value">{submitted}</p>}
    </form>
  )
}

export function KeyboardNav() {
  const [focused, setFocused] = useState('')
  return (
    <div>
      <button onFocus={() => setFocused('btn-a')} onBlur={() => setFocused('')}>Button A</button>
      <button onFocus={() => setFocused('btn-b')} onBlur={() => setFocused('')}>Button B</button>
      <span data-testid="focused">{focused}</span>
    </div>
  )
}

export function ToggleCheckbox() {
  const [checked, setChecked] = useState(false)
  return (
    <label>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => setChecked(e.target.checked)}
      />
      {' '}Accept terms
    </label>
  )
}

export function HoverMenu() {
  const [visible, setVisible] = useState(false)
  return (
    <div>
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        aria-haspopup="true"
        aria-expanded={visible}
      >
        Menu
      </button>
      {visible && (
        <ul role="menu" data-testid="dropdown">
          <li role="menuitem">Option 1</li>
          <li role="menuitem">Option 2</li>
        </ul>
      )}
    </div>
  )
}

export function EventLog() {
  const [events, setEvents] = useState<string[]>([])
  const log = (e: string) => setEvents(prev => [...prev, e])
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div>
      <input
        ref={inputRef}
        aria-label="Event log input"
        onFocus={() => log('focus')}
        onBlur={() => log('blur')}
        onKeyDown={e => log(`keydown: ${e.key}`)}
        onKeyUp={e => log(`keyup: ${e.key}`)}
        onChange={e => log(`change: ${e.target.value}`)}
        placeholder="Type to log events..."
      />
      <ul data-testid="event-log">
        {events.map((e, i) => <li key={i}>{e}</li>)}
      </ul>
      <button onClick={() => setEvents([])}>Clear</button>
    </div>
  )
}

// ─── 2.1 userEvent vs fireEvent ───────────────────────────────────────────────

function UserEventVsFireEvent() {
  return (
    <Section title="2.1 — userEvent vs fireEvent">
      <Info>userEvent simulates real browser interactions — pointer down/up, focus, composing text. fireEvent dispatches a single DOM event. Always prefer userEvent.</Info>
      <Pre>{`import userEvent from '@testing-library/user-event'

// Modern setup() API (v14+) — creates an instance with pointer tracking
const user = userEvent.setup()

// fireEvent.click — ONE MouseEvent(click, bubbles:true)
// userEvent.click  — pointerdown → pointerup → mousedown → mouseup → click
//                    Also handles focus, blur, aria changes

// For keyboard: userEvent.type() dispatches keydown/keypress/input/keyup per char.
// fireEvent.change() only fires "change" — misses keydown/keyup for event handlers
// that listen to specific keys (e.g., {Enter} to submit).

await user.click(screen.getByRole('button', { name: 'Submit' }))
await user.type(screen.getByLabelText('Email'), 'test@example.com')
await user.keyboard('{Enter}')
await user.tab()                    // Tab key navigation
await user.hover(menuButton)        // mouseenter + mouseover`}</Pre>
    </Section>
  )
}

// ─── 2.2 Live demo components ─────────────────────────────────────────────────

function LiveDemoSection() {
  return (
    <Section title="2.2 — Components under test (live)">
      <Info>These components are what the test file exercises. Interact with them to understand the expected behavior.</Info>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14 }}>
          <div style={{ color: '#555', fontSize: 10, marginBottom: 8 }}>COUNTER</div>
          <Counter />
        </div>
        <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14 }}>
          <div style={{ color: '#555', fontSize: 10, marginBottom: 8 }}>TEXT INPUT + SUBMIT</div>
          <TextInput />
        </div>
        <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14 }}>
          <div style={{ color: '#555', fontSize: 10, marginBottom: 8 }}>CHECKBOX</div>
          <ToggleCheckbox />
        </div>
        <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14 }}>
          <div style={{ color: '#555', fontSize: 10, marginBottom: 8 }}>HOVER MENU</div>
          <HoverMenu />
        </div>
      </div>
    </Section>
  )
}

// ─── 2.3 Keyboard patterns ────────────────────────────────────────────────────

function KeyboardPatterns() {
  return (
    <Section title="2.3 — Keyboard interaction patterns">
      <Pre>{`const user = userEvent.setup()

// Special key names use braces
await user.keyboard('{Enter}')
await user.keyboard('{Escape}')
await user.keyboard('{Tab}')
await user.keyboard('{Backspace}')
await user.keyboard('{ArrowDown}')

// Modifiers
await user.keyboard('{Shift>}A{/Shift}')  // Shift+A
await user.keyboard('{Control>}c{/Control}')  // Ctrl+C

// Type replaces value — use clear() first or selectAll
await user.clear(input)
await user.type(input, 'new value')

// Or: click to focus, then type
await user.click(input)
await user.type(input, 'hello{Enter}')   // type + submit`}</Pre>
    </Section>
  )
}

// ─── 2.4 Event ordering ───────────────────────────────────────────────────────

function EventOrderSection() {
  return (
    <Section title="2.4 — Event ordering with EventLog">
      <Info>The EventLog component shows every event in order. userEvent fires them in realistic sequence.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <EventLog />
      </div>
      <Pre>{`// What userEvent.type(input, 'hi') fires for each character:
// focus (once, on first key)
// keydown: h
// keypress: h  (for printable chars)
// input       (triggers React onChange)
// keyup: h
// keydown: i
// ... repeat

// Compare to fireEvent.change(input, { target: { value: 'hi' } })
// → only fires "change" event, skips key events entirely`}</Pre>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function UserEventsExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>02 · User Events</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        userEvent simulates full browser interaction sequences, not just single DOM events.
        The v14 setup() API tracks pointer state between calls, enabling realistic multi-step interactions.
      </p>
      <UserEventVsFireEvent />
      <LiveDemoSection />
      <KeyboardPatterns />
      <EventOrderSection />
    </div>
  )
}
