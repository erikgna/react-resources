import { useState, createContext, useContext } from 'react'
import { Section, Info, Pre } from '../shared'

// ─── Components under test ────────────────────────────────────────────────────
// These are mounted with cy.mount() in component.cy.tsx (no browser nav needed)

export function Button({
  children, onClick, variant = 'default', disabled = false,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'danger' | 'primary'
  disabled?: boolean
}) {
  const colors = {
    default: { bg: '#1e1e1e', border: '#2a2a2a', color: '#c0c0c0' },
    danger:  { bg: '#2a1111', border: '#5a1111', color: '#ff6b6b' },
    primary: { bg: '#1a2a1a', border: '#2a5a2a', color: '#4caf50' },
  }
  const c = colors[variant]
  return (
    <button
      data-cy="btn"
      data-variant={variant}
      onClick={onClick}
      disabled={disabled}
      style={{ padding: '5px 12px', background: c.bg, border: `1px solid ${c.border}`, color: c.color, borderRadius: 3, fontSize: 12, opacity: disabled ? 0.4 : 1 }}
    >
      {children}
    </button>
  )
}

// Theme context for provider test
const ThemeContext = createContext<{ dark: boolean }>({ dark: true })
export function ThemeProvider({ dark, children }: { dark: boolean; children: React.ReactNode }) {
  return <ThemeContext.Provider value={{ dark }}>{children}</ThemeContext.Provider>
}

export function ThemeAwareBox() {
  const { dark } = useContext(ThemeContext)
  return (
    <div data-cy="theme-box" data-theme={dark ? 'dark' : 'light'}
      style={{ padding: 12, background: dark ? '#0f0f0f' : '#f0f0f0', border: '1px solid #333', borderRadius: 4, fontSize: 13, color: dark ? '#e0e0e0' : '#111' }}>
      Theme: {dark ? 'dark' : 'light'}
    </div>
  )
}

export function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div data-cy="accordion">
      <button
        data-cy="accordion-trigger"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: '#141414', border: '1px solid #2a2a2a', color: '#e0e0e0', fontSize: 13, cursor: 'pointer', borderRadius: 3 }}
      >
        {title}
      </button>
      {open && (
        <div data-cy="accordion-content" role="region" style={{ padding: 12, background: '#0f0f0f', border: '1px solid #1e1e1e', borderTop: 'none', borderRadius: '0 0 3px 3px', fontSize: 13, color: '#888' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function MountSection() {
  return (
    <Section title="7.1 — cy.mount(): component testing mode">
      <Info>
        Cypress component testing mounts a component directly in a real browser — no full page, no cy.visit().
        Faster than E2E; real browser unlike jsdom.
      </Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10, display: 'flex', gap: 8 }}>
        <Button>Default</Button>
        <Button variant="primary">Primary</Button>
        <Button variant="danger">Danger</Button>
        <Button disabled>Disabled</Button>
      </div>
      <Pre>{`// cypress/support/component.ts
import { mount } from 'cypress/react'
Cypress.Commands.add('mount', mount)

// component spec — no cy.visit() needed
describe('Button', () => {
  it('renders with variant', () => {
    cy.mount(<Button variant="primary">Save</Button>)
    cy.get('[data-cy=btn]').should('have.text', 'Save')
    cy.get('[data-cy=btn]').should('have.attr', 'data-variant', 'primary')
  })

  it('calls onClick when clicked', () => {
    const onClick = cy.stub().as('click')
    cy.mount(<Button onClick={onClick}>Click me</Button>)
    cy.get('[data-cy=btn]').click()
    cy.get('@click').should('have.been.calledOnce')
  })

  it('is disabled when prop is set', () => {
    cy.mount(<Button disabled>Submit</Button>)
    cy.get('[data-cy=btn]').should('be.disabled')
  })
})`}</Pre>
    </Section>
  )
}

function ProviderSection() {
  return (
    <Section title="7.2 — mounting with context providers">
      <Info>Wrap cy.mount() in providers the same way RTL uses the wrapper option.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <ThemeProvider dark={true}>
          <ThemeAwareBox />
        </ThemeProvider>
      </div>
      <Pre>{`// Mount with provider inline
cy.mount(
  <ThemeProvider dark={true}>
    <ThemeAwareBox />
  </ThemeProvider>
)
cy.get('[data-cy=theme-box]').should('have.attr', 'data-theme', 'dark')

// Custom mountWithTheme command (cypress/support/component.ts)
Cypress.Commands.add('mountWithTheme', (component, { dark = true } = {}) => {
  return cy.mount(<ThemeProvider dark={dark}>{component}</ThemeProvider>)
})

// Usage
cy.mountWithTheme(<ThemeAwareBox />, { dark: false })
cy.get('[data-cy=theme-box]').should('have.attr', 'data-theme', 'light')`}</Pre>
    </Section>
  )
}

function AccordionSection() {
  return (
    <Section title="7.3 — stateful component test">
      <Info>Component tests can test local state, aria attributes, and DOM transitions.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <Accordion title="Click to expand">Content revealed on open</Accordion>
      </div>
      <Pre>{`cy.mount(<Accordion title="Details">Hidden content</Accordion>)

// Initially closed
cy.get('[data-cy=accordion-trigger]').should('have.attr', 'aria-expanded', 'false')
cy.get('[data-cy=accordion-content]').should('not.exist')

// Open it
cy.get('[data-cy=accordion-trigger]').click()
cy.get('[data-cy=accordion-trigger]').should('have.attr', 'aria-expanded', 'true')
cy.get('[data-cy=accordion-content]').should('be.visible').and('contain.text', 'Hidden content')

// Close it
cy.get('[data-cy=accordion-trigger]').click()
cy.get('[data-cy=accordion-content]').should('not.exist')`}</Pre>
    </Section>
  )
}

function E2eVsComponentSection() {
  return (
    <Section title="7.4 — E2E vs Component mode tradeoffs">
      <Pre>{`// E2E mode
// ✓ Tests real routing, auth, server responses
// ✓ Closest to real user experience
// ✗ Requires running dev server
// ✗ Slower (full page load per test)
// ✗ Network calls happen unless intercepted

// Component mode
// ✓ No server needed — just the component
// ✓ 3-5x faster than E2E
// ✓ Real browser (unlike jsdom)
// ✓ Hot reload during development
// ✗ Can't test routing, real network, multi-page flows
// ✗ Must mock all external dependencies

// Rule of thumb:
// Component: unit/integration level (one component + its children)
// E2E:       critical user flows (login → checkout, etc.)`}</Pre>
    </Section>
  )
}

export default function ComponentExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>07 · Component Testing</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Cypress component testing mounts components directly in a real Chromium browser without a running server.
        Faster than E2E, more realistic than jsdom. Use <code>npm run cy:component</code>.
      </p>
      <MountSection />
      <ProviderSection />
      <AccordionSection />
      <E2eVsComponentSection />
    </div>
  )
}
