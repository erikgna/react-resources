import { createContext, useContext, useState } from 'react'
import { Section, Row, Btn, Info, Pre, Box, ui } from '../shared'

// ─── 1. createContext — primitive default value ───────────────────────────────

const CountCtx = createContext(0)

function CountConsumer({ label }: { label: string }) {
  const count = useContext(CountCtx)
  return <span style={{ fontSize: 13, color: '#bbb' }}>{label}: <b style={{ color: '#e0e0e0' }}>{count}</b></span>
}

// ─── 2. Object context — referential identity matters ─────────────────────────

type UserCtxVal = { name: string; role: string }
const UserCtx = createContext<UserCtxVal>({ name: 'anonymous', role: 'guest' })

function UserDisplay() {
  const user = useContext(UserCtx)
  return <span style={{ fontSize: 13, color: '#bbb' }}>name: <b style={{ color: '#e0e0e0' }}>{user.name}</b> | role: <b style={{ color: '#e0e0e0' }}>{user.role}</b></span>
}

// ─── 3. Nested providers — inner shadows outer ────────────────────────────────

const ThemeCtx = createContext('dark')

function ThemeConsumer() {
  const theme = useContext(ThemeCtx)
  return (
    <div style={{
      padding: '6px 10px', borderRadius: 3, fontSize: 13,
      background: theme === 'dark' ? '#111' : '#f0f0f0',
      color: theme === 'dark' ? '#e0e0e0' : '#111',
      border: '1px solid #2a2a2a',
    }}>
      theme: <b>{theme}</b>
    </div>
  )
}

// ─── 4. Consumer component (legacy render-props API) ──────────────────────────

function LegacyConsumer() {
  return (
    <CountCtx.Consumer>
      {(val) => (
        <span style={{ fontSize: 13, color: '#bbb' }}>
          legacy Consumer: <b style={{ color: '#e0e0e0' }}>{val}</b>
        </span>
      )}
    </CountCtx.Consumer>
  )
}

// ─── 5. No Provider — default value behavior ─────────────────────────────────

const NoProviderCtx = createContext('DEFAULT_FALLBACK')

function OrphanConsumer() {
  const val = useContext(NoProviderCtx)
  return (
    <span style={{ fontSize: 13, color: '#f9a825' }}>
      no Provider above → <b>{val}</b>
    </span>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PropagationExperiment() {
  const [count, setCount] = useState(0)
  const [user, setUser] = useState<UserCtxVal>({ name: 'alice', role: 'admin' })
  const [outerTheme, setOuterTheme] = useState('dark')
  const [innerTheme, setInnerTheme] = useState('light')
  const [showInner, setShowInner] = useState(true)

  return (
    <div>
      <h2 style={ui.h2}>1 · Propagation Mechanics</h2>
      <p style={ui.desc}>
        <code>createContext</code>, <code>Provider</code>, <code>useContext</code>, <code>Consumer</code> — from scratch.
        No state libraries. Observe how value flows down the tree.
      </p>

      <Section title="1.1 Primitive Context — createContext + useContext">
        <Info>
          Provider wraps the subtree. <code>useContext</code> subscribes to the nearest Provider above.
          Primitive value (number): update triggers re-render in all consumers.
        </Info>
        <CountCtx.Provider value={count}>
          <Row style={{ marginBottom: 10 }}>
            <Btn onClick={() => setCount(c => c - 1)}>−</Btn>
            <span style={{ fontSize: 28, minWidth: 48, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{count}</span>
            <Btn onClick={() => setCount(c => c + 1)}>+</Btn>
            <Btn onClick={() => setCount(0)}>reset</Btn>
          </Row>
          <Row>
            <CountConsumer label="Consumer A" />
            <CountConsumer label="Consumer B" />
            <CountConsumer label="Consumer C" />
            <LegacyConsumer />
          </Row>
        </CountCtx.Provider>
        <Pre>{`const CountCtx = createContext(0)          // default = 0

<CountCtx.Provider value={count}>
  <CountConsumer />   // useContext(CountCtx) → count
  <CountConsumer />   // same — both subscribe independently
</CountCtx.Provider>`}</Pre>
      </Section>

      <Section title="1.2 Object Context — Reference Identity">
        <Info>
          Object context: every <code>setUser(...)</code> creates a new object reference → triggers re-render.
          Even if fields have same values, <code>Object.is</code> comparison fails because it's a new object.
        </Info>
        <UserCtx.Provider value={user}>
          <Row style={{ marginBottom: 10 }}>
            <Btn onClick={() => setUser({ name: 'alice', role: 'admin' })}>alice/admin</Btn>
            <Btn onClick={() => setUser({ name: 'bob', role: 'viewer' })}>bob/viewer</Btn>
            <Btn onClick={() => setUser({ name: 'alice', role: 'admin' })}>
              same values (new object ref!)
            </Btn>
          </Row>
          <UserDisplay />
        </UserCtx.Provider>
        <Pre>{`// Each button creates a NEW object → consumers re-render even if values identical
setUser({ name: 'alice', role: 'admin' })  // new ref → re-render
setUser({ name: 'alice', role: 'admin' })  // new ref → re-render again

// React uses Object.is(prevVal, nextVal) — fails for {} === {}
// Fix: useMemo on the value object (see Experiment 3)`}</Pre>
      </Section>

      <Section title="1.3 Nested Providers — Inner Shadows Outer">
        <Info>
          Inner Provider overrides outer for its subtree. Each consumer finds the nearest Provider ancestor.
          Outer theme: <b>{outerTheme}</b> | Inner theme: <b>{showInner ? innerTheme : 'n/a'}</b>
        </Info>
        <Row style={{ marginBottom: 12 }}>
          <Btn onClick={() => setOuterTheme(t => t === 'dark' ? 'light' : 'dark')}>
            toggle outer ({outerTheme})
          </Btn>
          <Btn onClick={() => setInnerTheme(t => t === 'light' ? 'dark' : 'light')}>
            toggle inner ({innerTheme})
          </Btn>
          <Btn onClick={() => setShowInner(s => !s)}>
            {showInner ? 'hide' : 'show'} inner provider
          </Btn>
        </Row>
        <ThemeCtx.Provider value={outerTheme}>
          <div style={{ padding: 12, border: '1px dashed #333', borderRadius: 3 }}>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>outer Provider ({outerTheme})</div>
            <Row style={{ marginBottom: 8 }}>
              <ThemeConsumer />
            </Row>
            {showInner ? (
              <ThemeCtx.Provider value={innerTheme}>
                <div style={{ padding: 10, border: '1px dashed #2a3a2a', borderRadius: 3, marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>inner Provider ({innerTheme}) — shadows outer</div>
                  <ThemeConsumer />
                </div>
              </ThemeCtx.Provider>
            ) : (
              <div style={{ padding: 10, border: '1px dashed #2a2a2a', borderRadius: 3, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>no inner Provider — falls back to outer</div>
                <ThemeConsumer />
              </div>
            )}
          </div>
        </ThemeCtx.Provider>
        <Pre>{`<ThemeCtx.Provider value="dark">       // outer
  <ThemeConsumer />                    // reads "dark"
  <ThemeCtx.Provider value="light">   // inner — overrides for subtree
    <ThemeConsumer />                  // reads "light"
  </ThemeCtx.Provider>
</ThemeCtx.Provider>`}</Pre>
      </Section>

      <Section title="1.4 No Provider — Default Value">
        <Info>
          When no Provider exists in the ancestor tree, <code>useContext</code> returns the default passed to <code>createContext()</code>.
          Default value is NEVER updated — it's static. Only useful for testing/fallback.
        </Info>
        <OrphanConsumer />
        <Pre>{`const NoProviderCtx = createContext('DEFAULT_FALLBACK')

// Somewhere deep in the tree with NO Provider above:
function OrphanConsumer() {
  const val = useContext(NoProviderCtx)  // → 'DEFAULT_FALLBACK'
  // val is static — updating default value has no effect at runtime
}`}</Pre>
      </Section>
    </div>
  )
}
