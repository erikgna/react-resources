import { useState } from 'react'
import { Section, Info, Pre, ErrorBoundary } from '../shared'

// ─── Components under test ────────────────────────────────────────────────────

export function BrokenComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Intentional render error')
  return <div data-cy="safe-output" style={{ color: '#4caf50', fontSize: 13 }}>Rendered safely</div>
}

export function NetworkErrorUI() {
  const [state, setState] = useState<'idle' | 'error'>('idle')
  const trigger = async () => {
    try {
      const res = await fetch('/api/broken')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch {
      setState('error')
    }
  }
  return (
    <div data-cy="network-error-ui">
      <button data-cy="trigger-btn" onClick={trigger}
        style={{ padding: '5px 12px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#c0c0c0', borderRadius: 3, fontSize: 12, marginBottom: 8 }}>
        Trigger Request
      </button>
      {state === 'error' && (
        <div data-cy="error-state" role="alert" style={{ color: '#ff6b6b', fontSize: 13 }}>Request failed</div>
      )}
    </div>
  )
}

export function RaceConditionUI() {
  const [result, setResult] = useState('')
  const slowFetch = () => {
    setTimeout(() => setResult('slow'), 300)
    setTimeout(() => setResult('fast'), 100)
  }
  return (
    <div data-cy="race-ui">
      <button data-cy="race-btn" onClick={slowFetch}
        style={{ padding: '5px 12px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#c0c0c0', borderRadius: 3, fontSize: 12, marginBottom: 8 }}>
        Trigger Race
      </button>
      <div data-cy="race-result" style={{ fontSize: 13, color: '#e0e0e0' }}>{result}</div>
    </div>
  )
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function CommonFailureSection() {
  return (
    <Section title="8.1 — common test failures + fixes">
      <Pre>{`// 1. Element not found — cy.get() times out
// Cause: wrong selector, element not rendered yet, wrong page
// Fix: check selector in DevTools, use cy.clock() if timing-dependent
cy.get('[data-cy=nonexistent]')   // Error: "Timed out retrying after 4000ms"

// 2. Detached DOM — element re-rendered between command and assertion
// Cause: React re-renders element after cy.get() resolves
// Fix: re-query or assert immediately after action
const btn = cy.get('[data-cy=btn]')   // Bad: save reference
cy.get('[data-cy=trigger]').click()   // React re-renders
btn.click()                           // Error: element detached

// Correct: re-query after action
cy.get('[data-cy=trigger]').click()
cy.get('[data-cy=btn]').click()       // fresh query

// 3. Assertion too early — passes before async data loads
// Cause: asserting before network/timer resolves
// Fix: wait for the element to have the expected value
cy.get('[data-cy=count]').should('have.text', '3')  // retries until '3'`}</Pre>
    </Section>
  )
}

function ErrorBoundarySection() {
  return (
    <Section title="8.2 — testing error boundary + uncaught exceptions">
      <Info>Catch React render errors and verify error boundary fallback UI.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <ErrorBoundary>
          <BrokenComponent shouldThrow={false} />
        </ErrorBoundary>
      </div>
      <Pre>{`// Prevent Cypress from failing on uncaught exceptions from React
Cypress.on('uncaught:exception', (err) => {
  // Return false to prevent the error from failing the test
  if (err.message.includes('Intentional render error')) return false
})

// Or selectively handle in beforeEach
beforeEach(() => {
  cy.on('uncaught:exception', () => false)
})

// Then assert the error boundary fallback rendered
cy.mount(
  <ErrorBoundary>
    <BrokenComponent shouldThrow={true} />
  </ErrorBoundary>
)
cy.contains('Caught by ErrorBoundary').should('be.visible')`}</Pre>
    </Section>
  )
}

function NetworkFailureSection() {
  return (
    <Section title="8.3 — testing network failure states">
      <Info>Use cy.intercept with forceNetworkError to test offline / server error states.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <NetworkErrorUI />
      </div>
      <Pre>{`cy.intercept('GET', '/api/broken', { forceNetworkError: true })

cy.get('[data-cy=trigger-btn]').click()
cy.get('[data-cy=error-state]').should('be.visible').and('have.text', 'Request failed')

// Test 404
cy.intercept('GET', '/api/broken', { statusCode: 404 })

// Test 500 with body
cy.intercept('POST', '/api/save', {
  statusCode: 500,
  body: { error: 'Internal server error' },
})`}</Pre>
    </Section>
  )
}

function ScreenshotSection() {
  return (
    <Section title="8.4 — screenshots + video on failure">
      <Info>Cypress auto-captures screenshots on failure and videos of the full run.</Info>
      <Pre>{`// cypress.config.ts — configure screenshot behavior
export default defineConfig({
  e2e: {
    screenshotsFolder: 'cypress/screenshots',
    videosFolder:      'cypress/videos',
    video: true,
    screenshotOnRunFailure: true,
  },
})

// Manual screenshot
cy.screenshot('before-submit')

// Screenshot element only
cy.get('[data-cy=registration-form]').screenshot('form-state')

// On failure, Cypress saves:
// cypress/screenshots/spec-name/test-name (failed).png
// cypress/videos/spec-name.mp4`}</Pre>
    </Section>
  )
}

function RaceSection() {
  return (
    <Section title="8.5 — race conditions + flaky tests">
      <Info>
        Flaky tests often signal real timing bugs. Use cy.clock() to eliminate non-determinism,
        not cy.wait(ms) which just adds slack.
      </Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <RaceConditionUI />
      </div>
      <Pre>{`// FLAKY: result depends on timing
cy.get('[data-cy=race-btn]').click()
cy.get('[data-cy=race-result]').should('have.text', 'fast')  // might see 'slow' briefly

// STABLE: use cy.clock() to control timing
cy.clock()
cy.get('[data-cy=race-btn]').click()
cy.tick(100)   // advance 100ms — only 'fast' timer fires
cy.get('[data-cy=race-result]').should('have.text', 'fast')
cy.tick(200)   // advance 200ms more — 'slow' timer fires
cy.get('[data-cy=race-result]').should('have.text', 'slow')`}</Pre>
    </Section>
  )
}

export default function FailuresExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>08 · Failures</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Flaky tests, timing issues, uncaught exceptions, detached DOM — common Cypress failure modes
        and how to fix them. Understanding failures builds intuition for writing stable tests.
      </p>
      <CommonFailureSection />
      <ErrorBoundarySection />
      <NetworkFailureSection />
      <ScreenshotSection />
      <RaceSection />
    </div>
  )
}
