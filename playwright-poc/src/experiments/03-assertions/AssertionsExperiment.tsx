import { useState } from 'react'
import { Section, Info, Pre, Row } from '../shared'

// ─── Components under test ────────────────────────────────────────────────────

export function ToggleBox() {
  const [visible, setVisible] = useState(true)
  return (
    <div>
      <button onClick={() => setVisible(v => !v)} style={{ padding: '5px 12px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#c0c0c0', borderRadius: 3, fontSize: 12 }}>
        {visible ? 'Hide' : 'Show'}
      </button>
      {visible && (
        <span data-testid="box" style={{ marginLeft: 10, color: '#4caf50' }}>I am visible</span>
      )}
    </div>
  )
}

export function DisabledField() {
  const [enabled, setEnabled] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label>
        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
        {' '}Enable field
      </label>
      <input
        data-testid="controlled-input"
        disabled={!enabled}
        placeholder="Only when enabled"
        style={{ padding: '4px 8px', background: '#111', border: '1px solid #333', color: '#e0e0e0', borderRadius: 3 }}
      />
    </div>
  )
}

export function CheckboxGroup() {
  const [items, setItems] = useState([
    { id: 'a', label: 'Alpha', checked: false },
    { id: 'b', label: 'Beta', checked: true },
    { id: 'c', label: 'Gamma', checked: false },
  ])
  const toggle = (id: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
  return (
    <div>
      {items.map(item => (
        <label key={item.id} style={{ display: 'block', marginBottom: 4 }}>
          <input type="checkbox" checked={item.checked} onChange={() => toggle(item.id)} />
          {' '}{item.label}
        </label>
      ))}
      <div data-testid="checked-count" style={{ marginTop: 6, fontSize: 12, color: '#888' }}>
        {items.filter(i => i.checked).length} selected
      </div>
    </div>
  )
}

export function ColorBox() {
  const [color, setColor] = useState('#4a9eff')
  return (
    <div>
      <div
        data-testid="color-box"
        style={{ width: 40, height: 40, background: color, borderRadius: 4, marginBottom: 8 }}
      />
      <button onClick={() => setColor('#ff6b6b')}
        style={{ padding: '4px 10px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#c0c0c0', borderRadius: 3, fontSize: 12 }}>
        Turn red
      </button>
    </div>
  )
}

export function FocusTarget() {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <input
        data-testid="focus-input"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Click to focus"
        style={{ padding: '4px 8px', background: '#111', border: '1px solid #333', color: '#e0e0e0', borderRadius: 3 }}
      />
      <span style={{ marginLeft: 8, fontSize: 12, color: focused ? '#4caf50' : '#666' }}>
        {focused ? 'focused' : 'blurred'}
      </span>
    </div>
  )
}

// ─── 3.1 Visibility ───────────────────────────────────────────────────────────

function VisibilitySection() {
  return (
    <Section title="3.1 — toBeVisible() / toBeHidden()">
      <Info>Playwright assertions auto-retry until the condition is met (or timeout). Unlike RTL synchronous throws.</Info>
      <div style={{ marginBottom: 10 }}>
        <ToggleBox />
      </div>
      <Pre>{`// Auto-retrying assertions — no await waitFor() needed
await expect(component.getByTestId('box')).toBeVisible()
await expect(component.getByTestId('box')).toBeHidden()

// toBeVisible() passes if element is in DOM and not hidden
// toBeHidden()  passes if element is absent OR has display:none / visibility:hidden

// Negate with .not:
await expect(component.getByText('Error')).not.toBeVisible()`}</Pre>
    </Section>
  )
}

// ─── 3.2 Text assertions ──────────────────────────────────────────────────────

function TextSection() {
  return (
    <Section title="3.2 — toHaveText() / toContainText()">
      <Info>toHaveText matches the full trimmed text. toContainText matches a substring.</Info>
      <Pre>{`await expect(heading).toHaveText('Welcome, Alice')        // exact match
await expect(heading).toHaveText(/welcome/i)               // regex
await expect(container).toContainText('partial string')    // substring

// On a multi-element locator (list), pass an array:
await expect(component.getByRole('listitem'))
  .toHaveText(['Apple', 'Banana', 'Cherry'])                // exact ordered match
await expect(component.getByRole('listitem'))
  .toContainText(['Apple', 'Cherry'])                       // subset match`}</Pre>
    </Section>
  )
}

// ─── 3.3 Value assertions ─────────────────────────────────────────────────────

function ValueSection() {
  return (
    <Section title="3.3 — toHaveValue() / toHaveAttribute()">
      <Info>toHaveValue reads the current input value. toHaveAttribute checks HTML attributes.</Info>
      <div style={{ marginBottom: 10 }}>
        <DisabledField />
      </div>
      <Pre>{`// Input value:
await expect(component.getByLabel('Message')).toHaveValue('Hello')
await expect(component.getByLabel('Message')).toHaveValue(/^Hello/)

// HTML attributes:
await expect(input).toHaveAttribute('type', 'email')
await expect(input).toHaveAttribute('placeholder', /search/i)
await expect(input).not.toHaveAttribute('disabled')

// toBeEnabled() / toBeDisabled() — preferred over attribute check:
await expect(component.getByTestId('controlled-input')).toBeDisabled()
await checkbox.check()
await expect(component.getByTestId('controlled-input')).toBeEnabled()`}</Pre>
    </Section>
  )
}

// ─── 3.4 Count assertions ─────────────────────────────────────────────────────

function CountSection() {
  return (
    <Section title="3.4 — toHaveCount() for list assertions">
      <Info>toHaveCount verifies the number of elements matched by a locator. Retries until count matches.</Info>
      <div style={{ marginBottom: 10 }}>
        <CheckboxGroup />
      </div>
      <Pre>{`await expect(component.getByRole('checkbox')).toHaveCount(3)

// Useful before indexing:
const items = component.getByRole('listitem')
await expect(items).toHaveCount(5)
await items.nth(4).click()          // safe — count verified`}</Pre>
    </Section>
  )
}

// ─── 3.5 State assertions ─────────────────────────────────────────────────────

function StateSection() {
  return (
    <Section title="3.5 — toBeChecked() / toBeFocused() / toBeEnabled()">
      <Info>Web-first state assertions — all auto-retry and work in real browser DOM.</Info>
      <Row style={{ marginBottom: 10, gap: 24 }}>
        <CheckboxGroup />
        <FocusTarget />
      </Row>
      <Pre>{`// Checkbox state:
await expect(component.getByLabel('Beta')).toBeChecked()
await expect(component.getByLabel('Alpha')).not.toBeChecked()

// Focus state:
await component.getByTestId('focus-input').focus()
await expect(component.getByTestId('focus-input')).toBeFocused()

// Enabled/disabled:
await expect(component.getByTestId('controlled-input')).toBeDisabled()
await component.getByLabel('Enable field').check()
await expect(component.getByTestId('controlled-input')).toBeEnabled()`}</Pre>
    </Section>
  )
}

// ─── 3.6 CSS assertions ──────────────────────────────────────────────────────

function CSSSection() {
  return (
    <Section title="3.6 — toHaveCSS() for style assertions">
      <Info>toHaveCSS checks computed styles. Useful for testing conditional styling without snapshot overhead.</Info>
      <div style={{ marginBottom: 10 }}>
        <ColorBox />
      </div>
      <Pre>{`// Computed style (resolved value, not shorthand):
await expect(component.getByTestId('color-box'))
  .toHaveCSS('background-color', 'rgb(74, 158, 255)')

// After interaction:
await component.getByRole('button', { name: 'Turn red' }).click()
await expect(component.getByTestId('color-box'))
  .toHaveCSS('background-color', 'rgb(255, 107, 107)')`}</Pre>
    </Section>
  )
}

// ─── 3.7 Soft assertions ─────────────────────────────────────────────────────

function SoftSection() {
  return (
    <Section title="3.7 — expect.soft() — collect all failures before throwing">
      <Info>Soft assertions don't stop the test on failure — they accumulate and report all failures at the end.</Info>
      <Pre>{`// Hard assertion (default): stops test immediately on failure
await expect(heading).toHaveText('Wrong text')  // test stops here

// Soft assertion: continues, collects failures
await expect.soft(heading).toHaveText('Wrong text')
await expect.soft(button).toBeEnabled()
// ... test continues
// All failures reported together at end of test

// Use when you want to check multiple things in one pass
// (e.g. form validation state — many fields may have issues simultaneously)`}</Pre>
    </Section>
  )
}

export default function AssertionsExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>03 · Assertions</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        All Playwright <code>expect()</code> assertions are web-first: they auto-retry
        until the condition is met or timeout is reached. Unlike RTL which throws
        synchronously, Playwright assertions return Promises.
      </p>
      <VisibilitySection />
      <TextSection />
      <ValueSection />
      <CountSection />
      <StateSection />
      <CSSSection />
      <SoftSection />
    </div>
  )
}
