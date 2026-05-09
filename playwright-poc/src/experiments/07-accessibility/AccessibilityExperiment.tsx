import { useState, useRef, useEffect } from 'react'
import { Section, Info, Pre } from '../shared'

// ─── Components under test ────────────────────────────────────────────────────

export function AccessibleForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!email.includes('@')) e.email = 'Valid email required'
    return e
  }

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length === 0) setSubmitted(true)
  }

  if (submitted) return <div><div role="status" aria-live="polite">Form submitted!</div></div>

  return (
    <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 280 }}>
      <div>
        <label htmlFor="a11y-name" style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 3 }}>Name *</label>
        <input
          id="a11y-name"
          aria-describedby={errors.name ? 'name-error' : undefined}
          aria-invalid={!!errors.name}
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ width: '100%', padding: '5px 8px', background: '#111', border: `1px solid ${errors.name ? '#ff6b6b' : '#333'}`, color: '#e0e0e0', borderRadius: 3 }}
        />
        {errors.name && <span id="name-error" role="alert" style={{ fontSize: 11, color: '#ff6b6b' }}>{errors.name}</span>}
      </div>
      <div>
        <label htmlFor="a11y-email" style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 3 }}>Email *</label>
        <input
          id="a11y-email"
          type="text"
          aria-describedby={errors.email ? 'email-error' : undefined}
          aria-invalid={!!errors.email}
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: '5px 8px', background: '#111', border: `1px solid ${errors.email ? '#ff6b6b' : '#333'}`, color: '#e0e0e0', borderRadius: 3 }}
        />
        {errors.email && <span id="email-error" role="alert" style={{ fontSize: 11, color: '#ff6b6b' }}>{errors.email}</span>}
      </div>
      <button type="submit" style={{ padding: '6px 14px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#c0c0c0', borderRadius: 3, fontSize: 13 }}>
        Submit
      </button>
    </form>
  )
}

export function FocusTrap({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  const firstRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) firstRef.current?.focus()
  }, [open])

  return (
    <div>
      <button onClick={() => setOpen(true)}
        style={{ padding: '5px 12px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#c0c0c0', borderRadius: 3, fontSize: 12 }}>
        Open modal
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Confirm action"
          style={{ marginTop: 12, background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: 16, maxWidth: 280 }}>
          <p style={{ marginBottom: 12, fontSize: 13, color: '#aaa' }}>Are you sure?</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button ref={firstRef} onClick={() => { setOpen(false); onClose?.() }}
              style={{ padding: '5px 12px', background: '#2a1111', border: '1px solid #5a1111', color: '#ff6b6b', borderRadius: 3, fontSize: 12 }}>
              Confirm
            </button>
            <button onClick={() => setOpen(false)}
              style={{ padding: '5px 12px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#c0c0c0', borderRadius: 3, fontSize: 12 }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function LiveRegion() {
  const [messages, setMessages] = useState<string[]>([])
  const [count, setCount] = useState(0)

  const notify = () => {
    const n = count + 1
    setCount(n)
    setMessages(m => [...m, `Notification ${n}`])
  }

  return (
    <div>
      <button onClick={notify}
        style={{ padding: '5px 12px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#c0c0c0', borderRadius: 3, fontSize: 12 }}>
        Add notification
      </button>
      <div
        role="log"
        aria-live="polite"
        aria-label="Notifications"
        data-testid="live-region"
        style={{ marginTop: 10, background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 3, padding: 10, minHeight: 60, fontSize: 12 }}
      >
        {messages.length === 0
          ? <span style={{ color: '#333' }}>No notifications</span>
          : messages.map((m, i) => <div key={i} style={{ color: '#7ec8a0', lineHeight: 1.6 }}>{m}</div>)
        }
      </div>
    </div>
  )
}

// ─── 7.1 Role-first as a11y signal ───────────────────────────────────────────

function RoleFirstSection() {
  return (
    <Section title="7.1 — getByRole as accessibility signal">
      <Info>
        If getByRole can't find your element, a screen reader can't either.
        Using role-first locators doubles as an a11y audit.
      </Info>
      <div style={{ marginBottom: 10 }}>
        <AccessibleForm />
      </div>
      <Pre>{`// Every getByRole call validates your ARIA semantics:
component.getByRole('textbox', { name: 'Name *' })     // requires <label> association
component.getByRole('button', { name: 'Submit' })      // requires accessible name
component.getByRole('alert')                           // requires role="alert" or aria-live
component.getByRole('dialog', { name: 'Confirm...' }) // requires aria-label on dialog

// If these fail, your component is inaccessible to screen readers.`}</Pre>
    </Section>
  )
}

// ─── 7.2 ARIA attributes ─────────────────────────────────────────────────────

function AriaSection() {
  return (
    <Section title="7.2 — Asserting ARIA attributes">
      <Info>Test that ARIA attributes are wired correctly — aria-invalid, aria-describedby, aria-expanded.</Info>
      <Pre>{`// aria-invalid on error:
await component.getByRole('button', { name: 'Submit' }).click()
const nameInput = component.getByRole('textbox', { name: 'Name *' })
await expect(nameInput).toHaveAttribute('aria-invalid', 'true')

// aria-describedby points to error message:
const describedBy = await nameInput.getAttribute('aria-describedby')
expect(describedBy).toBe('name-error')

// toHaveAccessibilityDescription() (Playwright 1.46+):
// await expect(nameInput).toHaveAccessibilityDescription('Name is required')`}</Pre>
    </Section>
  )
}

// ─── 7.3 Keyboard navigation ─────────────────────────────────────────────────

function KeyboardSection() {
  return (
    <Section title="7.3 — Keyboard navigation and focus order">
      <Info>Test Tab order and keyboard-only workflows. Real browser makes this accurate.</Info>
      <Pre>{`// Tab through form fields:
await component.getByRole('textbox', { name: 'Name *' }).focus()
await page.keyboard.press('Tab')
await expect(component.getByRole('textbox', { name: 'Email *' })).toBeFocused()
await page.keyboard.press('Tab')
await expect(component.getByRole('button', { name: 'Submit' })).toBeFocused()

// Submit via keyboard:
await page.keyboard.press('Enter')
await expect(component.getByRole('alert')).toBeVisible()   // validation error`}</Pre>
    </Section>
  )
}

// ─── 7.4 Focus management in modals ──────────────────────────────────────────

function FocusSection() {
  return (
    <Section title="7.4 — Focus management (dialog/modal)">
      <Info>Opening a modal should move focus to the first interactive element inside it.</Info>
      <div style={{ marginBottom: 10 }}>
        <FocusTrap />
      </div>
      <Pre>{`// Focus moves to Confirm button when modal opens:
await component.getByRole('button', { name: 'Open modal' }).click()
const dialog = component.getByRole('dialog')
await expect(dialog).toBeVisible()

// First focusable element in dialog has focus:
const confirmBtn = dialog.getByRole('button', { name: 'Confirm' })
await expect(confirmBtn).toBeFocused()

// Close and verify focus returns to trigger:
await dialog.getByRole('button', { name: 'Cancel' }).click()
await expect(dialog).not.toBeVisible()`}</Pre>
    </Section>
  )
}

// ─── 7.5 aria-live regions ───────────────────────────────────────────────────

function LiveRegionSection() {
  return (
    <Section title="7.5 — aria-live regions">
      <Info>Assert that dynamic content updates are announced via live regions.</Info>
      <div style={{ marginBottom: 10 }}>
        <LiveRegion />
      </div>
      <Pre>{`// Verify live region updates after action:
await component.getByRole('button', { name: 'Add notification' }).click()
const log = component.getByRole('log', { name: 'Notifications' })
await expect(log).toContainText('Notification 1')

// Multiple notifications:
await component.getByRole('button', { name: 'Add notification' }).click()
await expect(log).toContainText('Notification 2')`}</Pre>
    </Section>
  )
}

export default function AccessibilityExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>07 · Accessibility</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Playwright runs in a real browser with a real accessibility tree.
        Role-first locators are simultaneously a11y assertions.
        Use keyboard navigation tests to verify screen-reader-compatible UX.
      </p>
      <RoleFirstSection />
      <AriaSection />
      <KeyboardSection />
      <FocusSection />
      <LiveRegionSection />
    </div>
  )
}
