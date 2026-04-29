import { useRef } from 'react'
import { makeAutoObservable, observable } from 'mobx'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { Section, Row, Btn, Info, Pre, Box } from '../shared'

// ─── Shared store ─────────────────────────────────────────────────────────────

class SharedStore {
  name = 'Alice'
  count = 0
  flag = false
  constructor() { makeAutoObservable(this) }
  setName(s: string) { this.name = s }
  increment() { this.count++ }
  toggleFlag() { this.flag = !this.flag }
}

const sharedStore = new SharedStore()

// ─── 5.1 Fine-grained re-renders with observer ────────────────────────────────

const NameBox = observer(function NameBox() {
  const renders = useRef(0)
  renders.current++
  return (
    <Box name="NameBox" renders={renders.current} active={true}>
      {sharedStore.name}
    </Box>
  )
})

const CountBox = observer(function CountBox() {
  const renders = useRef(0)
  renders.current++
  return (
    <Box name="CountBox" renders={renders.current} active={true}>
      {sharedStore.count}
    </Box>
  )
})

const FlagBox = observer(function FlagBox() {
  const renders = useRef(0)
  renders.current++
  return (
    <Box name="FlagBox" renders={renders.current} active={true}>
      {String(sharedStore.flag)}
    </Box>
  )
})

function FineGrainedSection() {
  return (
    <Section title="5.1 — observer — only the component that reads the changed observable re-renders">
      <Info>
        Each <code>observer</code> component tracks its own reads. Changing <code>count</code> only re-renders <code>CountBox</code>. No selectors, no memo — MobX tracks reads automatically.
      </Info>
      <Row style={{ marginBottom: 10 }}>
        <Btn onClick={() => sharedStore.setName(sharedStore.name === 'Alice' ? 'Bob' : 'Alice')}>Change name</Btn>
        <Btn onClick={() => sharedStore.increment()}>Increment count</Btn>
        <Btn onClick={() => sharedStore.toggleFlag()}>Toggle flag</Btn>
      </Row>
      <Row>
        <NameBox />
        <CountBox />
        <FlagBox />
      </Row>
      <Pre>{`const NameBox = observer(() => <div>{store.name}</div>)
const CountBox = observer(() => <div>{store.count}</div>)

// Changing store.count → only CountBox re-renders
// Changing store.name → only NameBox re-renders
// No useSelector, no memo needed — MobX tracks reads during render`}</Pre>
    </Section>
  )
}

// ─── 5.2 Without observer — silent failure ────────────────────────────────────

// NOT wrapped in observer — reads observable but won't update
function NameBoxNoObserver() {
  const renders = useRef(0)
  renders.current++
  return (
    <Box name="No observer" renders={renders.current}>
      {sharedStore.name}
    </Box>
  )
}

function CountBoxNoObserver() {
  const renders = useRef(0)
  renders.current++
  return (
    <Box name="No observer" renders={renders.current}>
      {sharedStore.count}
    </Box>
  )
}

function WithoutObserverSection() {
  return (
    <Section title="5.2 — Without observer — renders once, never updates">
      <Info>
        Reading an observable inside a non-observer component returns the current value but doesn't subscribe. Updates are silently missed. This is the most common MobX React bug.
      </Info>
      <Row style={{ marginBottom: 10 }}>
        <Btn onClick={() => sharedStore.setName(sharedStore.name === 'Alice' ? 'Bob' : 'Alice')}>Change name</Btn>
        <Btn onClick={() => sharedStore.increment()}>Increment count</Btn>
      </Row>
      <Row>
        <NameBoxNoObserver />
        <CountBoxNoObserver />
      </Row>
      <p style={{ color: '#ff6b6b', fontSize: 12, marginTop: 10 }}>
        renders: {1} — these components render once and stop. They read observables but are not subscribed.
      </p>
      <Pre>{`// Missing observer — reads observable, no subscription
function NameBox() {
  return <div>{store.name}</div>  // reads once, never re-reads
}
// store.name changes → NameBox is NOT notified → stale value displayed`}</Pre>
    </Section>
  )
}

// ─── 5.3 useLocalObservable — component-scoped store ─────────────────────────

const LocalObservableForm = observer(function LocalObservableForm() {
  const form = useLocalObservable(() => ({
    value: '',
    get isValid() { return this.value.length > 2 },
    get charCount() { return this.value.length },
    setValue(s: string) { this.value = s },
    reset() { this.value = '' },
  }))

  const renders = useRef(0)
  renders.current++

  return (
    <Section title="5.3 — useLocalObservable — component-scoped store with computed">
      <Info>
        <code>useLocalObservable</code> creates an observable object scoped to this component. No external store, no props — self-contained reactivity including computed values.
      </Info>
      <Row style={{ marginBottom: 8 }}>
        <input
          value={form.value}
          onChange={e => form.setValue(e.target.value)}
          placeholder="type at least 3 chars..."
          style={{ background: '#111', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '5px 9px', borderRadius: 3, fontSize: 13 }}
        />
        <Btn onClick={() => form.reset()} danger>Reset</Btn>
      </Row>
      <Row>
        <Box name="LocalForm" renders={renders.current}>
          chars: {form.charCount} | valid: {form.isValid ? '✓' : '✗'}
        </Box>
      </Row>
      <Pre>{`const form = useLocalObservable(() => ({
  value: '',
  get isValid() { return this.value.length > 2 },  // computed
  setValue(s: string) { this.value = s },            // action
}))
// No useState, no external store. Direct mutation inside observer.`}</Pre>
    </Section>
  )
})

// ─── 5.4 Render granularity stress test ───────────────────────────────────────

const listStore = observable({
  items: Array.from({ length: 50 }, (_, i) => ({ id: i, value: i * 2 })),
})

const ObserverItem = observer(function ObserverItem({ idx }: { idx: number }) {
  const renders = useRef(0)
  renders.current++
  const item = listStore.items[idx]
  return (
    <div style={{ display: 'inline-block', margin: 2, padding: '3px 6px', background: '#141414', border: '1px solid #1e1e1e', fontSize: 11, minWidth: 60 }}>
      [{idx}]: {item.value} <span style={{ color: renders.current > 1 ? '#ff6b6b' : '#4caf50' }}>r:{renders.current}</span>
    </div>
  )
})

function NonObserverList({ items }: { items: { id: number; value: number }[] }) {
  const renders = useRef(0)
  renders.current++
  return (
    <div>
      <p style={{ color: '#555', fontSize: 11, marginBottom: 4 }}>non-observer parent renders: {renders.current}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {items.map(item => (
          <div key={item.id} style={{ padding: '3px 6px', background: '#141414', border: '1px solid #1e1e1e', fontSize: 11, minWidth: 60 }}>
            [{item.id}]: {item.value}
          </div>
        ))}
      </div>
    </div>
  )
}

const ObserverListContainer = observer(function ObserverListContainer() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      {listStore.items.map((_, i) => <ObserverItem key={i} idx={i} />)}
    </div>
  )
})

function StressTestSection() {
  return (
    <Section title="5.4 — Render granularity — 50-item list, update one item">
      <Info>
        Observer items: update item[0] → only item[0] re-renders (r counter goes red). Non-observer: entire list re-renders. Watch the render counters.
      </Info>
      <Row style={{ marginBottom: 8 }}>
        <Btn onClick={() => { listStore.items[0].value++ }}>Update item[0] (observer)</Btn>
        <Btn onClick={() => { listStore.items.forEach(item => { item.value++ }) }}>Update all items</Btn>
      </Row>
      <p style={{ color: '#555', fontSize: 11, marginBottom: 4 }}>observer items (each tracks its own reads):</p>
      <ObserverListContainer />
      <Pre>{`// Each item is an observer component
const ObserverItem = observer(({ idx }) => {
  return <div>{listStore.items[idx].value}</div>
})
// Update items[0] → only ObserverItem at idx=0 re-renders
// All other items stay at renders:1`}</Pre>
    </Section>
  )
}

export default function ObserverExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>05 · Observer & React Integration</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        <code>observer()</code> patches React's render function to track observable reads. Only components that read a changed observable re-render. No selectors, no memo, no equality functions required.
      </p>
      <FineGrainedSection />
      <WithoutObserverSection />
      <LocalObservableForm />
      <StressTestSection />
    </div>
  )
}
