import { useState, useEffect, useRef } from 'react'
import { makeAutoObservable, autorun, reaction, when } from 'mobx'
import { Section, Row, Btn, Info, Pre, Log } from '../shared'

// ─── 3.1 autorun ─────────────────────────────────────────────────────────────

class TempStore {
  celsius = 20
  constructor() { makeAutoObservable(this) }
  set(v: number) { this.celsius = v }
}

const tempStore = new TempStore()

function AutorunSection() {
  const [log, setLog] = useState<string[]>([])
  const disposeRef = useRef<(() => void) | null>(null)
  const [disposed, setDisposed] = useState(false)

  useEffect(() => {
    disposeRef.current = autorun(() => {
      const f = (tempStore.celsius * 9 / 5 + 32).toFixed(1)
      setLog(p => [...p, `${tempStore.celsius}°C = ${f}°F`])
    })
    return () => disposeRef.current?.()
  }, [])

  return (
    <Section title="3.1 — autorun — fires immediately, re-fires on change, disposable">
      <Info>
        <code>autorun</code> runs immediately on creation (no need to wait for a change). Returns a disposer — call it to stop the reaction.
      </Info>
      <Row>
        <Btn onClick={() => tempStore.set(tempStore.celsius + 5)}>+5°C</Btn>
        <Btn onClick={() => tempStore.set(tempStore.celsius - 5)}>-5°C</Btn>
        <Btn onClick={() => {
          if (!disposed) {
            disposeRef.current?.()
            disposeRef.current = null
            setDisposed(true)
            setLog(p => [...p, '— autorun disposed — changes below won\'t fire —'])
          }
        }} danger>Dispose autorun</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`const dispose = autorun(() => {
  console.log(store.celsius + '°C = ' + (celsius * 9/5 + 32) + '°F')
})
// ↑ fires immediately on creation
// fires again whenever celsius changes

dispose()  // stops the reaction — no more logs`}</Pre>
    </Section>
  )
}

// ─── 3.2 reaction ─────────────────────────────────────────────────────────────

function ReactionSection() {
  const [log, setLog] = useState<string[]>([])
  const [logFI, setLogFI] = useState<string[]>([])
  const disposeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    disposeRef.current = reaction(
      () => tempStore.celsius,
      (newVal, oldVal) => setLog(p => [...p, `celsius changed: ${oldVal} → ${newVal}`])
    )
    // fireImmediately version
    const d2 = reaction(
      () => tempStore.celsius,
      (newVal) => setLogFI(p => [...p, `[fireImmediately] celsius = ${newVal}`]),
      { fireImmediately: true }
    )
    return () => { disposeRef.current?.(); d2() }
  }, [])

  return (
    <Section title="3.2 — reaction(data, effect) — fires only on change, exposes oldVal">
      <Info>
        Unlike <code>autorun</code>, <code>reaction</code> does NOT fire on creation. The data function is tracked; the effect function is not. Use <code>fireImmediately: true</code> to match autorun behavior.
      </Info>
      <Row>
        <Btn onClick={() => tempStore.set(tempStore.celsius + 5)}>+5°C</Btn>
        <Btn onClick={() => tempStore.set(tempStore.celsius - 5)}>-5°C</Btn>
      </Row>
      <p style={{ color: '#555', fontSize: 11, marginTop: 8 }}>reaction (no initial fire):</p>
      <Log entries={log} />
      <p style={{ color: '#555', fontSize: 11, marginTop: 8 }}>reaction with fireImmediately:</p>
      <Log entries={logFI} />
      <Pre>{`reaction(
  () => store.celsius,            // data fn — tracked
  (newVal, oldVal) => { ... }     // effect fn — NOT tracked
)
// Does NOT fire on create
// oldVal exposed (autorun doesn't have this)
// { fireImmediately: true } → behaves like autorun`}</Pre>
    </Section>
  )
}

// ─── 3.3 when ─────────────────────────────────────────────────────────────────

class CounterStore {
  count = 0
  constructor() { makeAutoObservable(this) }
  increment() { this.count++ }
}

const counterStore = new CounterStore()

function WhenSection() {
  const [log, setLog] = useState<string[]>([])
  const [fired, setFired] = useState(false)
  const [promiseLog, setPromiseLog] = useState<string[]>([])

  useEffect(() => {
    const dispose = when(
      () => counterStore.count > 5,
      () => {
        setFired(true)
        setLog(p => [...p, `when fired at count=${counterStore.count} — self-disposed`])
      }
    )
    return () => dispose()
  }, [])

  const handlePromiseWhen = async () => {
    setPromiseLog(p => [...p, 'waiting for count > 10...'])
    try {
      await when(() => counterStore.count > 10, { timeout: 5000 })
      setPromiseLog(p => [...p, `resolved! count=${counterStore.count}`])
    } catch {
      setPromiseLog(p => [...p, 'timed out after 5000ms'])
    }
  }

  return (
    <Section title="3.3 — when — one-shot, self-disposes, Promise form">
      <Info>
        <code>when</code> runs exactly once when the predicate becomes true, then self-disposes. Can also be used as a <code>Promise</code> with an optional <code>timeout</code>.
      </Info>
      <Row>
        <Btn onClick={() => counterStore.increment()}>Increment count ({counterStore.count})</Btn>
        <Btn onClick={handlePromiseWhen}>Start await when(&gt;10)</Btn>
      </Row>
      {fired && <p style={{ color: '#4caf50', fontSize: 12, marginTop: 8 }}>✓ when fired and self-disposed</p>}
      <p style={{ color: '#555', fontSize: 11, marginTop: 8 }}>callback when (count &gt; 5):</p>
      <Log entries={log} />
      <p style={{ color: '#555', fontSize: 11, marginTop: 8 }}>Promise when (count &gt; 10, timeout 5s):</p>
      <Log entries={promiseLog} />
      <Pre>{`// Callback form — fires once, self-disposes
when(() => store.count > 5, () => console.log('threshold crossed'))

// Promise form — await it
await when(() => store.ready, { timeout: 5000 })
// Rejects with Error('WHEN_TIMEOUT') if not met in time`}</Pre>
    </Section>
  )
}

// ─── 3.4 Disposal memory leak demo ────────────────────────────────────────────

function DisposalDemo() {
  const [log, setLog] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  const mountBad = () => {
    if (mounted) return
    setMounted(true)
    // No disposer stored — leak!
    autorun(() => {
      setLog(p => [...p, `[LEAKED autorun] celsius=${tempStore.celsius}`])
    })
    setLog(p => [...p, '[bad] mounted autorun WITHOUT disposer'])
  }

  const [goodDispose, setGoodDispose] = useState<(() => void) | null>(null)
  const [goodMounted, setGoodMounted] = useState(false)

  const mountGood = () => {
    if (goodMounted) return
    setGoodMounted(true)
    const dispose = autorun(() => {
      setLog(p => [...p, `[GOOD autorun] celsius=${tempStore.celsius}`])
    })
    setGoodDispose(() => dispose)
    setLog(p => [...p, '[good] mounted autorun WITH stored disposer'])
  }

  const unmountGood = () => {
    goodDispose?.()
    setGoodMounted(false)
    setGoodDispose(null)
    setLog(p => [...p, '[good] disposed — no more logs from good autorun'])
  }

  return (
    <Section title="3.4 — Disposal — memory leak without disposer">
      <Info>
        An undisposed <code>autorun</code> keeps firing forever. Change celsius after mounting the bad autorun to see it still running.
      </Info>
      <Row>
        <Btn onClick={mountBad} danger>Mount bad autorun (no disposer)</Btn>
        <Btn onClick={mountGood}>Mount good autorun</Btn>
        <Btn onClick={unmountGood} danger>Unmount good autorun</Btn>
        <Btn onClick={() => tempStore.set(tempStore.celsius + 1)}>celsius +1 (trigger)</Btn>
      </Row>
      <Log entries={log} />
      <Pre>{`// BAD — reaction lives forever, even after component unmounts
autorun(() => console.log(store.celsius))

// GOOD — store the disposer
const dispose = autorun(() => console.log(store.celsius))

// In React:
useEffect(() => {
  return autorun(() => console.log(store.celsius))  // return disposer directly
}, [])`}</Pre>
    </Section>
  )
}

export default function ReactionsExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>03 · Reactions</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Three reaction primitives: <code>autorun</code> (immediate, re-runs), <code>reaction</code> (change-only, exposes old/new), <code>when</code> (one-shot). All return a disposer — always call it.
      </p>
      <AutorunSection />
      <ReactionSection />
      <WhenSection />
      <DisposalDemo />
    </div>
  )
}
