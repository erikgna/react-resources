import { useState } from 'react'
import { Section, Info, Pre } from '../shared'

// ─── Components under test ────────────────────────────────────────────────────

export interface FormData {
  name: string
  email: string
  role: string
  agree: boolean
}

export function RegistrationForm({ onSubmit }: { onSubmit?: (data: FormData) => void }) {
  const [data, setData] = useState<FormData>({ name: '', email: '', role: 'viewer', agree: false })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitted, setSubmitted] = useState(false)

  const validate = () => {
    const e: typeof errors = {}
    if (!data.name.trim()) e.name = 'Name is required'
    if (!data.email.includes('@')) e.email = 'Invalid email'
    if (!data.agree) e.agree = 'You must agree'
    return e
  }

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length === 0) {
      setSubmitted(true)
      onSubmit?.(data)
    }
  }

  if (submitted) {
    return <div data-cy="success-banner" style={{ color: '#4caf50', fontSize: 13 }}>Registered as {data.name}!</div>
  }

  return (
    <form data-cy="registration-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 280 }}>
      <div>
        <label htmlFor="name-input" style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 3 }}>Name</label>
        <input id="name-input" data-cy="name-input" value={data.name} onChange={e => setData(d => ({ ...d, name: e.target.value }))}
          aria-invalid={!!errors.name} aria-describedby="name-error"
          style={{ background: '#111', border: `1px solid ${errors.name ? '#ff6b6b' : '#2a2a2a'}`, color: '#e0e0e0', padding: '5px 9px', borderRadius: 3, fontSize: 13, width: '100%', outline: 'none' }}
        />
        {errors.name && <div id="name-error" data-cy="name-error" role="alert" style={{ color: '#ff6b6b', fontSize: 11, marginTop: 3 }}>{errors.name}</div>}
      </div>

      <div>
        <label htmlFor="email-input" style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 3 }}>Email</label>
        <input id="email-input" data-cy="email-input" type="email" value={data.email} onChange={e => setData(d => ({ ...d, email: e.target.value }))}
          aria-invalid={!!errors.email} aria-describedby="email-error"
          style={{ background: '#111', border: `1px solid ${errors.email ? '#ff6b6b' : '#2a2a2a'}`, color: '#e0e0e0', padding: '5px 9px', borderRadius: 3, fontSize: 13, width: '100%', outline: 'none' }}
        />
        {errors.email && <div id="email-error" data-cy="email-error" role="alert" style={{ color: '#ff6b6b', fontSize: 11, marginTop: 3 }}>{errors.email}</div>}
      </div>

      <div>
        <label htmlFor="role-select" style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 3 }}>Role</label>
        <select id="role-select" data-cy="role-select" value={data.role} onChange={e => setData(d => ({ ...d, role: e.target.value }))}
          style={{ background: '#111', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '5px 9px', borderRadius: 3, fontSize: 13, width: '100%' }}>
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <label data-cy="agree-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#888', cursor: 'pointer' }}>
        <input type="checkbox" data-cy="agree-checkbox" checked={data.agree} onChange={e => setData(d => ({ ...d, agree: e.target.checked }))} />
        I agree to the terms
      </label>
      {errors.agree && <div data-cy="agree-error" role="alert" style={{ color: '#ff6b6b', fontSize: 11 }}>{errors.agree}</div>}

      <button type="submit" data-cy="submit-btn"
        style={{ padding: '6px 14px', background: '#1a2a1a', border: '1px solid #2a5a2a', color: '#4caf50', borderRadius: 3, fontSize: 12, alignSelf: 'flex-start' }}>
        Register
      </button>
    </form>
  )
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function ValidationSection() {
  return (
    <Section title="6.1 — form validation flow">
      <Info>Test the full submit → error → fix → success cycle.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <RegistrationForm />
      </div>
      <Pre>{`// Submit empty form — see errors
cy.get('[data-cy=submit-btn]').click()
cy.get('[data-cy=name-error]').should('have.text', 'Name is required')
cy.get('[data-cy=email-error]').should('have.text', 'Invalid email')
cy.get('[data-cy=agree-error]').should('have.text', 'You must agree')

// aria-invalid attribute signals error to assistive tech
cy.get('[data-cy=name-input]').should('have.attr', 'aria-invalid', 'true')

// Fix and submit
cy.get('[data-cy=name-input]').type('Alice')
cy.get('[data-cy=email-input]').type('alice@example.com')
cy.get('[data-cy=role-select]').select('admin')
cy.get('[data-cy=agree-checkbox]').check()
cy.get('[data-cy=submit-btn]').click()
cy.get('[data-cy=success-banner]').should('contain.text', 'Alice')`}</Pre>
    </Section>
  )
}

function AccessibilitySection() {
  return (
    <Section title="6.2 — accessibility-first form patterns">
      <Info>Forms with proper label associations are testable without data-cy attributes.</Info>
      <Pre>{`// Label association (htmlFor/id pair) enables cy.get by label
cy.get('label[for=name-input]').should('have.text', 'Name')
cy.get('#name-input').type('Alice')      // by ID from label

// aria-invalid signals error state
cy.get('[aria-invalid=true]').should('have.length', 2)

// role="alert" for error messages (announced by screen readers)
cy.get('[role=alert]').should('have.length', 3)

// Focus flow: Tab through fields
cy.get('[data-cy=name-input]').focus()
cy.realPress('Tab')                      // cypress-real-events plugin
cy.focused().should('have.attr', 'data-cy', 'email-input')`}</Pre>
    </Section>
  )
}

function SubmitSpySection() {
  return (
    <Section title="6.3 — spy on form submission handler">
      <Info>Use cy.spy() or cy.stub() to verify callback props are called with correct data.</Info>
      <Pre>{`// Mount with a spy via cy.spy()
const onSubmit = cy.stub().as('submitSpy')
cy.mount(<RegistrationForm onSubmit={onSubmit} />)  // component test

cy.get('[data-cy=name-input]').type('Alice')
cy.get('[data-cy=email-input]').type('alice@example.com')
cy.get('[data-cy=agree-checkbox]').check()
cy.get('[data-cy=submit-btn]').click()

cy.get('@submitSpy').should('have.been.calledOnce')
cy.get('@submitSpy').should('have.been.calledWith', {
  name: 'Alice',
  email: 'alice@example.com',
  role: 'viewer',
  agree: true,
})`}</Pre>
    </Section>
  )
}

export default function FormsExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>06 · Forms</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Form testing covers the full user flow: fill fields, trigger validation, fix errors, submit.
        Cypress fires real keyboard events, making it faithful to what users actually experience.
      </p>
      <ValidationSection />
      <AccessibilitySection />
      <SubmitSpySection />
    </div>
  )
}
