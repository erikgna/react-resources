import { useState } from 'react'
import { Section, Info, Pre, Row, Log } from '../shared'

// ─── Components under test ────────────────────────────────────────────────────

export function Counter() {
  const [count, setCount] = useState(0)
  return (
    <div data-cy="counter">
      <span data-cy="count" style={{ fontSize: 20, color: '#e0e0e0', marginRight: 12 }}>{count}</span>
      <button data-cy="inc-btn" onClick={() => setCount(c => c + 1)} style={{ padding: '4px 10px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#4caf50', borderRadius: 3, fontSize: 12 }}>+</button>
      <button data-cy="dec-btn" onClick={() => setCount(c => c - 1)} style={{ marginLeft: 6, padding: '4px 10px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#ff6b6b', borderRadius: 3, fontSize: 12 }}>-</button>
      <button data-cy="reset-btn" onClick={() => setCount(0)} style={{ marginLeft: 6, padding: '4px 10px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#888', borderRadius: 3, fontSize: 12 }}>reset</button>
    </div>
  )
}

export function TextInput() {
  const [value, setValue] = useState('')
  return (
    <div data-cy="text-input-demo">
      <input
        data-cy="text-input"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Type something..."
        style={{ background: '#111', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '5px 9px', borderRadius: 3, fontSize: 13, outline: 'none', width: 200 }}
      />
      <span data-cy="char-count" style={{ marginLeft: 10, fontSize: 12, color: '#555' }}>{value.length} chars</span>
      <button data-cy="clear-btn" onClick={() => setValue('')} style={{ marginLeft: 8, padding: '4px 8px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#888', borderRadius: 3, fontSize: 11 }}>clear</button>
    </div>
  )
}

export function SelectInput() {
  const [selected, setSelected] = useState('vue')
  return (
    <div data-cy="select-demo">
      <select
        data-cy="framework-select"
        value={selected}
        onChange={e => setSelected(e.target.value)}
        style={{ background: '#111', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '5px 9px', borderRadius: 3, fontSize: 13 }}
      >
        <option value="react">React</option>
        <option value="vue">Vue</option>
        <option value="angular">Angular</option>
        <option value="svelte">Svelte</option>
      </select>
      <span data-cy="selected-value" style={{ marginLeft: 10, fontSize: 12, color: '#888' }}>selected: {selected}</span>
    </div>
  )
}

export function CheckboxGroup() {
  const [checked, setChecked] = useState<Record<string, boolean>>({ ts: true, lint: false, tests: false })
  return (
    <div data-cy="checkbox-group">
      {Object.entries(checked).map(([key, val]) => (
        <label key={key} data-cy={`check-${key}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13, color: '#c0c0c0', cursor: 'pointer' }}>
          <input
            type="checkbox"
            data-cy={`checkbox-${key}`}
            checked={val}
            onChange={e => setChecked(prev => ({ ...prev, [key]: e.target.checked }))}
          />
          {key}
        </label>
      ))}
      <span data-cy="enabled-count" style={{ fontSize: 11, color: '#555' }}>
        {Object.values(checked).filter(Boolean).length} enabled
      </span>
    </div>
  )
}

export function HoverMenu() {
  const [open, setOpen] = useState(false)
  const [log, setLog] = useState<string[]>([])
  return (
    <div data-cy="hover-menu" style={{ position: 'relative', display: 'inline-block' }}>
      <button
        data-cy="menu-trigger"
        onMouseEnter={() => { setOpen(true); setLog(l => [...l, 'mouseenter']) }}
        onMouseLeave={() => { setOpen(false); setLog(l => [...l, 'mouseleave']) }}
        onFocus={() => setLog(l => [...l, 'focus'])}
        style={{ padding: '5px 12px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#c0c0c0', borderRadius: 3, fontSize: 12 }}
      >
        Menu
      </button>
      {open && (
        <div data-cy="menu-dropdown" style={{ position: 'absolute', top: '100%', left: 0, background: '#141414', border: '1px solid #2a2a2a', borderRadius: 3, padding: 8, minWidth: 120, zIndex: 10 }}>
          <div data-cy="menu-item-edit" style={{ padding: '4px 8px', fontSize: 12, color: '#c0c0c0', cursor: 'pointer' }}>Edit</div>
          <div data-cy="menu-item-delete" style={{ padding: '4px 8px', fontSize: 12, color: '#ff6b6b', cursor: 'pointer' }}>Delete</div>
        </div>
      )}
      <Log entries={log} />
    </div>
  )
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function ClickSection() {
  return (
    <Section title="2.1 — cy.click(): click interactions">
      <Info>cy.click() triggers real browser click events including focus, mousedown, mouseup sequences.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <Counter />
      </div>
      <Pre>{`cy.get('[data-cy=inc-btn]').click()
cy.get('[data-cy=count]').should('have.text', '1')

// Multiple clicks
cy.get('[data-cy=inc-btn]').click().click().click()
cy.get('[data-cy=count]').should('have.text', '3')

// Force click hidden/overlapping elements
cy.get('[data-cy=inc-btn]').click({ force: true })`}</Pre>
    </Section>
  )
}

function TypeSection() {
  return (
    <Section title="2.2 — cy.type(): keyboard input">
      <Info>cy.type() fires keydown/keypress/keyup per character. Supports special keys like {'{backspace}'}, {'{enter}'}, {'{selectAll}'}.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <TextInput />
      </div>
      <Pre>{`cy.get('[data-cy=text-input]').type('hello')
cy.get('[data-cy=char-count]').should('have.text', '5 chars')

// Clear then type
cy.get('[data-cy=text-input]').clear().type('world')

// Special keys
cy.get('[data-cy=text-input]').type('{selectAll}{del}')
cy.get('[data-cy=text-input]').type('{ctrl+a}')

// Slow typing (for debugging)
cy.get('[data-cy=text-input]').type('slow', { delay: 100 })`}</Pre>
    </Section>
  )
}

function SelectSection() {
  return (
    <Section title="2.3 — cy.select(): dropdown selection">
      <Info>cy.select() works on native {'<select>'} elements. Pass value string or display text.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <SelectInput />
      </div>
      <Pre>{`// Select by value attribute
cy.get('[data-cy=framework-select]').select('react')
cy.get('[data-cy=selected-value]').should('have.text', 'selected: react')

// Select by display text
cy.get('[data-cy=framework-select]').select('Angular')

// Get current value
cy.get('[data-cy=framework-select]').should('have.value', 'angular')`}</Pre>
    </Section>
  )
}

function CheckSection() {
  return (
    <Section title="2.4 — cy.check() / cy.uncheck(): checkboxes">
      <Info>cy.check() and cy.uncheck() assert the element is a checkbox/radio before acting.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <CheckboxGroup />
      </div>
      <Pre>{`cy.get('[data-cy=checkbox-lint]').check()
cy.get('[data-cy=enabled-count]').should('have.text', '2 enabled')

cy.get('[data-cy=checkbox-ts]').uncheck()
cy.get('[data-cy=enabled-count]').should('have.text', '1 enabled')

// Check by value
cy.get('input[type=checkbox]').check(['ts', 'lint'])`}</Pre>
    </Section>
  )
}

function HoverSection() {
  return (
    <Section title="2.5 — .trigger(): hover + custom events">
      <Info>cy.trigger() fires arbitrary DOM events. Use for hover menus, drag-start, custom events.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <Row><HoverMenu /></Row>
      </div>
      <Pre>{`// Trigger hover
cy.get('[data-cy=menu-trigger]').trigger('mouseenter')
cy.get('[data-cy=menu-dropdown]').should('be.visible')

// Trigger custom event
cy.get('[data-cy=menu-trigger]').trigger('mouseleave')
cy.get('[data-cy=menu-dropdown]').should('not.exist')

// Note: cy.hover() doesn't exist — use trigger('mouseenter')`}</Pre>
    </Section>
  )
}

export default function InteractionsExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>02 · Interactions</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Cypress fires real browser events — not synthetic ones. <code>cy.click()</code>, <code>cy.type()</code>,
        <code>cy.select()</code> dispatch the full event sequence a real user would trigger.
      </p>
      <ClickSection />
      <TypeSection />
      <SelectSection />
      <CheckSection />
      <HoverSection />
    </div>
  )
}
