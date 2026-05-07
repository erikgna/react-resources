import { useState } from 'react'
import { create, type StateCreator } from 'zustand'
import { devtools, combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { Section, Row, Btn, Info, Pre, Log } from '../shared'

// ─── 3.1 Custom logger middleware — how middleware wraps ──────────────────────

type Logger = <T>(
  initializer: StateCreator<T>,
  name?: string,
) => StateCreator<T>

const logger: Logger = (initializer, name = 'store') => (set, get, api) => {
  const wrappedSet: typeof set = (partial, replace?) => {
    const prev = get()
    // @ts-expect-error replace overload
    set(partial, replace)
    const next = get()
    console.log(`[${name}] setState`, { prev, next })
  }
  return initializer(wrappedSet as typeof set, get, api)
}

const useLoggedStore = create<{ count: number; inc: () => void }>()(
  logger(
    (set) => ({
      count: 0,
      inc: () => set(s => ({ count: s.count + 1 })),
    }),
    'LoggedStore',
  )
)

function LoggerMiddlewareSection() {
  const count = useLoggedStore(s => s.count)

  return (
    <Section title="3.1 — Custom logger middleware — how middleware wraps createStore">
      <Info>
        Middleware wraps the initializer: receives <code>(set, get, api)</code>, replaces <code>set</code> with a version that logs, then calls the original initializer with the wrapped set. Open the browser console to see logs.
      </Info>
      <Row>
        <Btn onClick={() => useLoggedStore.getState().inc()}>inc() — logs prev/next to console</Btn>
      </Row>
      <p style={{ color: '#888', fontSize: 12, marginTop: 8 }}>count: {count} — check console for logger output</p>
      <Pre>{`type Logger = <T>(initializer: StateCreator<T>, name?: string) => StateCreator<T>

const logger: Logger = (initializer, name) => (set, get, api) => {
  const wrappedSet = (partial, replace?) => {
    const prev = get()
    set(partial, replace)    // call the REAL set
    console.log(name, { prev, next: get() })
  }
  return initializer(wrappedSet, get, api)
}

// Use: create(logger((set) => ({ ... }), 'MyStore'))
// middleware = a function that wraps set and returns the same initializer shape`}</Pre>
    </Section>
  )
}

// ─── 3.2 immer middleware ─────────────────────────────────────────────────────

interface ImmerState {
  count: number
  items: string[]
  nested: { value: number }
  inc: () => void
  push: (item: string) => void
  deepMutate: () => void
}

const useImmerStore = create<ImmerState>()(
  immer((set) => ({
    count: 0,
    items: [],
    nested: { value: 0 },
    inc: () => set(draft => { draft.count++ }),
    push: (item: string) => set(draft => { draft.items.push(item) }),
    deepMutate: () => set(draft => { draft.nested.value++ }),
  }))
)

let immerItemCount = 0

function ImmerSection() {
  const { count, items, nested } = useImmerStore(s => ({ count: s.count, items: s.items, nested: s.nested }))

  return (
    <Section title="3.2 — immer middleware — draft mutations instead of object spread">
      <Info>
        <code>immer</code> wraps <code>set</code> to call <code>produce(state, updater)</code> when the updater doesn't return a value. Nested mutations work without spreading. Same Proxy mechanism as MobX's observable — but explicit, not automatic.
      </Info>
      <Row>
        <Btn onClick={() => useImmerStore.getState().inc()}>draft.count++</Btn>
        <Btn onClick={() => useImmerStore.getState().push(`item${++immerItemCount}`)}>draft.items.push()</Btn>
        <Btn onClick={() => useImmerStore.getState().deepMutate()}>draft.nested.value++</Btn>
      </Row>
      <p style={{ color: '#888', fontSize: 12, marginTop: 8 }}>
        count: {count} | items: [{items.join(', ')}] | nested.value: {nested.value}
      </p>
      <Pre>{`const useStore = create<State>()(
  immer((set) => ({
    count: 0,
    items: [],
    nested: { value: 0 },

    // Draft mutation — no spread required
    inc: () => set(draft => { draft.count++ }),
    push: (item) => set(draft => { draft.items.push(item) }),
    deepMutate: () => set(draft => { draft.nested.value++ }),

    // Still works with object return (non-draft form)
    reset: () => set({ count: 0, items: [], nested: { value: 0 } }),
  }))
)
// immer intercepts set() — when updater returns void, wraps it in produce()`}</Pre>
    </Section>
  )
}

// ─── 3.3 devtools middleware ──────────────────────────────────────────────────

interface DevState {
  count: number
  label: string
  inc: () => void
  setLabel: (l: string) => void
  reset: () => void
}

const useDevStore = create<DevState>()(
  devtools(
    (set) => ({
      count: 0,
      label: 'initial',
      inc: () => set(s => ({ count: s.count + 1 }), false, 'inc'),
      setLabel: (label) => set({ label }, false, 'setLabel'),
      reset: () => set({ count: 0, label: 'initial' }, false, 'reset'),
    }),
    { name: 'ZustandDevStore' }
  )
)

function DevtoolsSection() {
  const { count, label } = useDevStore(s => ({ count: s.count, label: s.label }))

  return (
    <Section title="3.3 — devtools middleware — Redux DevTools integration">
      <Info>
        <code>devtools</code> intercepts every <code>set</code> call and emits to the Redux DevTools extension. The third arg to <code>set</code> becomes the action name. Open Redux DevTools browser extension to see the action log and state diffs.
      </Info>
      <Row>
        <Btn onClick={() => useDevStore.getState().inc()}>inc (action: "inc")</Btn>
        <Btn onClick={() => useDevStore.getState().setLabel('updated')}>setLabel (action: "setLabel")</Btn>
        <Btn onClick={() => useDevStore.getState().reset()} danger>reset (action: "reset")</Btn>
      </Row>
      <p style={{ color: '#888', fontSize: 12, marginTop: 8 }}>count: {count} | label: {label}</p>
      <Pre>{`const useStore = create<State>()(
  devtools(
    (set) => ({
      count: 0,
      // Third arg to set = action name visible in Redux DevTools
      inc: () => set(s => ({ count: s.count + 1 }), false, 'inc'),
      reset: () => set({ count: 0 }, false, 'reset'),
    }),
    { name: 'ZustandDevStore' }  // store name in DevTools panel
  )
)
// No time-travel with Zustand devtools (unlike Redux) — only action log + state diffs`}</Pre>
    </Section>
  )
}

// ─── 3.4 Stacked middleware: devtools(immer(...)) ─────────────────────────────

interface StackedState {
  count: number
  tags: string[]
  inc: () => void
  addTag: (t: string) => void
}

const useStackedStore = create<StackedState>()(
  devtools(
    immer((set) => ({
      count: 0,
      tags: [],
      inc: () => set(draft => { draft.count++ }, false, 'inc'),
      addTag: (tag: string) => set(draft => { draft.tags.push(tag) }, false, 'addTag'),
    })),
    { name: 'StackedStore' }
  )
)

let tagCount = 0

function StackedMiddlewareSection() {
  const { count, tags } = useStackedStore(s => ({ count: s.count, tags: s.tags }))

  return (
    <Section title="3.4 — Stacked middleware: devtools(immer(...))">
      <Info>
        Middleware composes right-to-left. <code>set</code> as seen by the initializer is: the real Zustand set → wrapped by immer → wrapped by devtools. Each layer adds its behavior and calls the next.
      </Info>
      <Row>
        <Btn onClick={() => useStackedStore.getState().inc()}>draft.count++ (immer + devtools)</Btn>
        <Btn onClick={() => useStackedStore.getState().addTag(`tag${++tagCount}`)}>draft.tags.push() (immer + devtools)</Btn>
      </Row>
      <p style={{ color: '#888', fontSize: 12, marginTop: 8 }}>count: {count} | tags: [{tags.join(', ')}]</p>
      <Pre>{`// Execution order when you call set(draft => { ... }):
// 1. devtools intercepts → prepares to log action
// 2. immer intercepts → runs produce(state, draft => { ... })
// 3. real set runs → merges new state into store
// 4. immer returns new state → devtools logs it

create<S>()(
  devtools(          // outer: action logging
    immer(           // inner: draft mutations
      (set) => ({ ... })
    ),
    { name: 'Stack' }
  )
)`}</Pre>
    </Section>
  )
}

// ─── 3.5 combine — state + actions without TypeScript gymnastics ──────────────

const useCombinedStore = create(
  combine(
    { count: 0, text: 'hello' },
    (set) => ({
      inc: () => set(s => ({ count: s.count + 1 })),
      setText: (text: string) => set({ text }),
      reset: () => set({ count: 0, text: 'hello' }),
    })
  )
)

function CombineSection() {
  const [log, setLog] = useState<string[]>([])
  const { count, text } = useCombinedStore(s => ({ count: s.count, text: s.text }))

  return (
    <Section title="3.5 — combine — plain state object + actions without type juggling">
      <Info>
        <code>combine(state, actions)</code> merges both into a single store type. Avoids the awkward <code>create&lt;State & Actions&gt;()</code> pattern where you repeat types in the initializer.
      </Info>
      <Row>
        <Btn onClick={() => {
          useCombinedStore.getState().inc()
          setLog(l => [...l, `inc → count=${useCombinedStore.getState().count}`])
        }}>inc()</Btn>
        <Btn onClick={() => {
          useCombinedStore.getState().setText('changed')
          setLog(l => [...l, `setText → text=${useCombinedStore.getState().text}`])
        }}>setText</Btn>
        <Btn onClick={() => useCombinedStore.getState().reset()} danger>reset</Btn>
        <Btn onClick={() => setLog([])} danger>Clear</Btn>
      </Row>
      <p style={{ color: '#888', fontSize: 12, marginTop: 8 }}>count: {count} | text: {text}</p>
      <Log entries={log} />
      <Pre>{`const useStore = create(
  combine(
    { count: 0, text: 'hello' },  // plain state — fully typed
    (set) => ({                    // actions — set typed to the full merged type
      inc: () => set(s => ({ count: s.count + 1 })),
      setText: (text: string) => set({ text }),
    })
  )
)
// TypeScript infers: { count: number; text: string; inc: () => void; setText: ... }`}</Pre>
    </Section>
  )
}

export default function MiddlewareExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>03 · Middleware</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Middleware wraps the initializer — replacing <code>set</code> with an enhanced version. Compose as many layers as needed: each receives the next layer's set and passes its own down.
      </p>
      <LoggerMiddlewareSection />
      <ImmerSection />
      <DevtoolsSection />
      <StackedMiddlewareSection />
      <CombineSection />
    </div>
  )
}
