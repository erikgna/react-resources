import { useState } from 'react'
import { Section, Info, Pre, Row } from '../shared'

// ─── Components under test ────────────────────────────────────────────────────

export function StatusPanel() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  return (
    <div data-cy="status-panel">
      <Row style={{ marginBottom: 10 }}>
        {(['idle', 'loading', 'success', 'error'] as const).map(s => (
          <button key={s} data-cy={`set-${s}`} onClick={() => setStatus(s)}
            style={{ padding: '4px 10px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#c0c0c0', borderRadius: 3, fontSize: 11 }}>
            {s}
          </button>
        ))}
      </Row>
      <div data-cy="status-idle" style={{ display: status === 'idle' ? 'block' : 'none', color: '#555', fontSize: 13 }}>Idle</div>
      {status === 'loading' && <div data-cy="status-loading" style={{ color: '#ffa500', fontSize: 13 }}>Loading...</div>}
      {status === 'success' && <div data-cy="status-success" style={{ color: '#4caf50', fontSize: 13 }}>Success!</div>}
      {status === 'error' && <div data-cy="status-error" role="alert" style={{ color: '#ff6b6b', fontSize: 13 }}>Error occurred</div>}
    </div>
  )
}

export function AttributeDemo() {
  const [disabled, setDisabled] = useState(false)
  const [href, setHref] = useState('https://example.com')
  return (
    <div data-cy="attribute-demo">
      <button
        data-cy="toggle-btn"
        disabled={disabled}
        onClick={() => setDisabled(d => !d)}
        aria-pressed={disabled}
        style={{ padding: '5px 12px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: disabled ? '#333' : '#c0c0c0', borderRadius: 3, fontSize: 12, marginBottom: 8 }}
      >
        {disabled ? 'Disabled' : 'Enabled'}
      </button>
      <a data-cy="ext-link" href={href} onClick={e => { e.preventDefault(); setHref('https://updated.com') }}
        style={{ marginLeft: 12, fontSize: 12, color: '#4a9eff' }}>
        Link
      </a>
    </div>
  )
}

export function ClassDemo() {
  const [active, setActive] = useState(false)
  return (
    <div data-cy="class-demo">
      <button data-cy="toggle-class" onClick={() => setActive(a => !a)}
        className={active ? 'is-active' : ''}
        style={{ padding: '5px 12px', background: active ? '#1a2a3a' : '#1e1e1e', border: `1px solid ${active ? '#4a9eff' : '#2a2a2a'}`, color: active ? '#4a9eff' : '#c0c0c0', borderRadius: 3, fontSize: 12 }}>
        {active ? 'Active' : 'Inactive'}
      </button>
    </div>
  )
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function ShouldSection() {
  return (
    <Section title="3.1 — .should(): chainable assertions">
      <Info>.should() asserts on the subject and retries until passing or timeout. Assertions are Chai-based.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <StatusPanel />
      </div>
      <Pre>{`// Existence
cy.get('[data-cy=status-success]').should('exist')
cy.get('[data-cy=status-error]').should('not.exist')

// Visibility
cy.get('[data-cy=status-loading]').should('be.visible')
cy.get('[data-cy=status-idle]').should('not.be.visible')

// Text content
cy.get('[data-cy=status-success]').should('have.text', 'Success!')
cy.get('[data-cy=status-error]').should('contain.text', 'Error')

// Chained with .and()
cy.get('[data-cy=status-success]')
  .should('be.visible')
  .and('have.text', 'Success!')`}</Pre>
    </Section>
  )
}

function AttributeSection() {
  return (
    <Section title="3.2 — attribute assertions">
      <Info>Assert element attributes: disabled, href, aria-* properties.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <AttributeDemo />
      </div>
      <Pre>{`// Disabled state
cy.get('[data-cy=toggle-btn]').should('not.be.disabled')
cy.get('[data-cy=toggle-btn]').click()
cy.get('[data-cy=toggle-btn]').should('be.disabled')

// Attribute value
cy.get('[data-cy=ext-link]').should('have.attr', 'href', 'https://example.com')

// Attribute existence (no value check)
cy.get('[data-cy=toggle-btn]').should('have.attr', 'aria-pressed')`}</Pre>
    </Section>
  )
}

function ClassSection() {
  return (
    <Section title="3.3 — CSS class assertions">
      <Info>Assert presence or absence of CSS classes after interaction.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <ClassDemo />
      </div>
      <Pre>{`cy.get('[data-cy=toggle-class]').should('not.have.class', 'is-active')
cy.get('[data-cy=toggle-class]').click()
cy.get('[data-cy=toggle-class]').should('have.class', 'is-active')`}</Pre>
    </Section>
  )
}

function NegativeSection() {
  return (
    <Section title="3.4 — negative assertions + retry-ability">
      <Info>
        Cypress retries .should() until the assertion passes (default 4s timeout).
        Negative assertions like <code>not.exist</code> must be used carefully — Cypress
        retries until the condition is true, not just once.
      </Info>
      <Pre>{`// Correct: assert absence AFTER an action that removes the element
cy.get('[data-cy=set-success]').click()
cy.get('[data-cy=status-error]').should('not.exist')    // retries until gone

// WRONG: asserting absence immediately (passes before element appears)
cy.get('[data-cy=status-success]').should('not.exist')  // may pass trivially

// Length assertions
cy.get('[data-cy=user-card]').should('have.length', 3)

// Value assertions
cy.get('input[data-cy=text-input]').should('have.value', 'hello')`}</Pre>
    </Section>
  )
}

function ExpectSection() {
  return (
    <Section title="3.5 — expect(): imperative assertions in .then()">
      <Info>Use expect() when you need the DOM value in a variable before asserting.</Info>
      <Pre>{`cy.get('[data-cy=count]').then($el => {
  const text = $el.text()
  expect(parseInt(text)).to.be.greaterThan(0)
})

// Or wrap the value
cy.get('[data-cy=count]').invoke('text').then(text => {
  expect(text.trim()).to.equal('3')
})

// invoke() to call jQuery methods on the subject
cy.get('[data-cy=text-input]').invoke('val').should('eq', 'hello')`}</Pre>
    </Section>
  )
}

export default function AssertionsExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>03 · Assertions</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Cypress assertions are Chai-based and retry automatically. <code>.should()</code> keeps
        retrying the whole chain until the assertion passes or times out — this is retry-ability.
      </p>
      <ShouldSection />
      <AttributeSection />
      <ClassSection />
      <NegativeSection />
      <ExpectSection />
    </div>
  )
}
