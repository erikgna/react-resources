import { useEffect, useState } from 'react'
import { Section, Info, Pre, Row } from '../shared'

// ─── Components under test ────────────────────────────────────────────────────

export function DelayedMessage({ delayMs = 1000 }: { delayMs?: number }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delayMs)
    return () => clearTimeout(t)
  }, [delayMs])
  return (
    <div data-cy="delayed-msg-container">
      {visible
        ? <div data-cy="delayed-msg" style={{ color: '#4caf50', fontSize: 13 }}>Loaded!</div>
        : <div data-cy="delayed-placeholder" style={{ color: '#555', fontSize: 13 }}>Waiting...</div>
      }
    </div>
  )
}

export function PollingStatus() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setCount(c => c + 1), 500)
    return () => clearInterval(id)
  }, [])
  return (
    <div data-cy="polling-status">
      <span data-cy="tick-count" style={{ fontSize: 13, color: '#e0e0e0' }}>ticks: {count}</span>
    </div>
  )
}

export function AnimationBox() {
  const [phase, setPhase] = useState<'idle' | 'enter' | 'done'>('idle')
  const start = () => {
    setPhase('enter')
    setTimeout(() => setPhase('done'), 800)
  }
  return (
    <div data-cy="animation-box">
      <button data-cy="start-animation" onClick={start}
        style={{ padding: '5px 12px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#c0c0c0', borderRadius: 3, fontSize: 12, marginBottom: 8 }}>
        Start
      </button>
      <div data-cy="animation-phase" style={{ fontSize: 13, color: phase === 'done' ? '#4caf50' : '#ffa500' }}>
        {phase}
      </div>
    </div>
  )
}

export function ClockDemo() {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => setElapsed(Date.now() - start), 100)
    return () => clearInterval(id)
  }, [])
  return (
    <div data-cy="clock-demo">
      <span data-cy="elapsed" style={{ fontSize: 13, color: '#e0e0e0' }}>{elapsed}ms elapsed</span>
    </div>
  )
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function RetrySection() {
  return (
    <Section title="5.1 — retry-ability: automatic waiting">
      <Info>
        Every cy command retries its assertion until it passes or times out (default 4s).
        No explicit waits needed for DOM changes.
      </Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <DelayedMessage delayMs={1500} />
      </div>
      <Pre>{`// Cypress waits up to 4s for [data-cy=delayed-msg] to appear
cy.get('[data-cy=delayed-msg]').should('be.visible').and('have.text', 'Loaded!')

// Increase timeout for slow operations
cy.get('[data-cy=delayed-msg]', { timeout: 10000 }).should('exist')

// Wait for absence (retries until NOT exist)
cy.get('[data-cy=delayed-placeholder]').should('not.exist')`}</Pre>
    </Section>
  )
}

function ClockSection() {
  return (
    <Section title="5.2 — cy.clock() + cy.tick(): control time">
      <Info>cy.clock() takes over Date, setTimeout, setInterval. cy.tick() advances fake time instantly.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <Row>
          <DelayedMessage delayMs={5000} />
          <ClockDemo />
        </Row>
      </div>
      <Pre>{`// Without cy.clock(): test waits 5 real seconds
// With cy.clock(): test completes instantly

cy.clock()                               // freeze time before component mounts
cy.visit('/')                            // component starts with frozen time
cy.tick(5000)                            // advance 5 seconds instantly
cy.get('[data-cy=delayed-msg]').should('be.visible')

// Control intervals
cy.clock()
cy.tick(500)                             // fire one setInterval tick
cy.get('[data-cy=tick-count]').should('have.text', 'ticks: 1')
cy.tick(500)                             // fire second tick
cy.get('[data-cy=tick-count]').should('have.text', 'ticks: 2')`}</Pre>
    </Section>
  )
}

function WaitSection() {
  return (
    <Section title="5.3 — cy.wait(): explicit waits">
      <Info>
        Prefer retry-ability over cy.wait(ms). Only use cy.wait(ms) as a last resort.
        cy.wait('@alias') for network requests is fine.
      </Info>
      <Pre>{`// AVOID: arbitrary time waits (flaky — too short on slow CI)
cy.wait(1000)
cy.get('[data-cy=delayed-msg]').should('exist')

// PREFER: retry-ability — Cypress polls until assertion passes
cy.get('[data-cy=delayed-msg]').should('be.visible')   // waits up to 4s

// OK: wait for aliased intercept
cy.intercept('GET', '/api/data').as('getData')
cy.get('[data-cy=load-btn]').click()
cy.wait('@getData')                      // waits for the network request, not time

// cy.waitUntil() — cypress-wait-until plugin (not built-in)
// cy.waitUntil(() => cy.get('[data-cy=count]').invoke('text').then(t => parseInt(t) > 5))`}</Pre>
    </Section>
  )
}

function AnimationSection() {
  return (
    <Section title="5.4 — testing animations + transitions">
      <Info>Use cy.clock() to skip animation delays, or assert on intermediate states.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <AnimationBox />
      </div>
      <Pre>{`// Assert intermediate state exists briefly
cy.get('[data-cy=start-animation]').click()
cy.get('[data-cy=animation-phase]').should('have.text', 'enter')
cy.get('[data-cy=animation-phase]').should('have.text', 'done')  // retries until 'done'

// Use cy.clock() to skip animation
cy.clock()
cy.get('[data-cy=start-animation]').click()
cy.get('[data-cy=animation-phase]').should('have.text', 'enter')
cy.tick(800)
cy.get('[data-cy=animation-phase]').should('have.text', 'done')`}</Pre>
    </Section>
  )
}

export default function AsyncExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>05 · Async</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Cypress is asynchronous by default — every command is queued and executed in sequence.
        Retry-ability means assertions automatically wait. <code>cy.clock()</code> makes time-dependent
        tests instant and deterministic.
      </p>
      <RetrySection />
      <ClockSection />
      <WaitSection />
      <AnimationSection />
    </div>
  )
}
