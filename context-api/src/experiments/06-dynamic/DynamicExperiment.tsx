import { createContext, useContext, useMemo, useState, useRef, useEffect, memo } from 'react'
import { Section, Row, Btn, Info, Pre, Box, ui } from '../shared'

// ─── Render counter ───────────────────────────────────────────────────────────

function useRenderCount() {
  const ref = useRef(0)
  ref.current += 1
  return ref.current
}

// ─── High-frequency counter context ──────────────────────────────────────────

const TickCtx = createContext(0)

function TickDisplay({ id }: { id: number }) {
  const tick = useContext(TickCtx)
  const renders = useRenderCount()
  return <Box name={`tick-${id}`} renders={renders}>tick: {tick}</Box>
}

// ─── Typing input context ─────────────────────────────────────────────────────

const InputCtx = createContext('')

function InputMirror({ id }: { id: number }) {
  const val = useContext(InputCtx)
  const renders = useRenderCount()
  return <Box name={`mirror-${id}`} renders={renders}>{val || <span style={{ color: '#444' }}>empty</span>}</Box>
}

// ─── Large list context ───────────────────────────────────────────────────────

type Item = { id: number; value: number; highlighted: boolean }
const ListCtx = createContext<Item[]>([])

function ListItem({ item }: { item: Item }) {
  return (
    <div style={{
      padding: '2px 6px', fontSize: 11, borderRadius: 2,
      background: item.highlighted ? '#1a2a1a' : '#0a0a0a',
      color: item.highlighted ? '#7ec8a0' : '#444',
      border: `1px solid ${item.highlighted ? '#3a5a3a' : '#111'}`,
    }}>
      #{item.id}: {item.value}
    </div>
  )
}

function LargeListConsumer({ label }: { label: string }) {
  const items = useContext(ListCtx)
  const renders = useRenderCount()
  return (
    <div style={{ border: '1px solid #1e1e1e', borderRadius: 3, padding: 10, minWidth: 200 }}>
      <div style={{ fontSize: 10, color: '#555', marginBottom: 6, textTransform: 'uppercase' }}>
        {label} [r:{renders}]
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, maxHeight: 120, overflowY: 'auto' }}>
        {items.slice(0, 50).map(item => <ListItem key={item.id} item={item} />)}
        {items.length > 50 && <div style={{ fontSize: 11, color: '#555' }}>+{items.length - 50} more</div>}
      </div>
      <div style={{ fontSize: 11, color: '#555', marginTop: 6 }}>
        total: {items.length} | highlighted: {items.filter(i => i.highlighted).length}
      </div>
    </div>
  )
}

// ─── Prop drilling comparison ─────────────────────────────────────────────────

function PropItem({ value, highlighted }: { value: number; highlighted: boolean }) {
  return (
    <div style={{
      padding: '2px 6px', fontSize: 11, borderRadius: 2,
      background: highlighted ? '#1a1a2a' : '#0a0a0a',
      color: highlighted ? '#79c0ff' : '#444',
      border: `1px solid ${highlighted ? '#2a2a5a' : '#111'}`,
    }}>
      p:{value}
    </div>
  )
}

function PropListConsumer({ items }: { items: Item[] }) {
  const renders = useRenderCount()
  return (
    <div style={{ border: '1px solid #1e1e1e', borderRadius: 3, padding: 10, minWidth: 200 }}>
      <div style={{ fontSize: 10, color: '#555', marginBottom: 6, textTransform: 'uppercase' }}>
        prop drilling [r:{renders}]
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, maxHeight: 120, overflowY: 'auto' }}>
        {items.slice(0, 50).map(item => <PropItem key={item.id} value={item.value} highlighted={item.highlighted} />)}
      </div>
      <div style={{ fontSize: 11, color: '#555', marginTop: 6 }}>total: {items.length}</div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DynamicExperiment() {
  const [running, setRunning] = useState(false)
  const [tick, setTick] = useState(0)
  const [inputVal, setInputVal] = useState('')
  const [listSize, setListSize] = useState(100)
  const [listVersion, setListVersion] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setTick(t => t + 1), 16)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  // List — stable unless listVersion or listSize changes
  const items = useMemo<Item[]>(() => {
    const arr: Item[] = []
    for (let i = 0; i < listSize; i++) {
      arr.push({ id: i, value: Math.floor(Math.random() * 1000), highlighted: i % 7 === 0 })
    }
    return arr
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listSize, listVersion])

  return (
    <div>
      <h2 style={ui.h2}>6 · Dynamic Context</h2>
      <p style={ui.desc}>
        High-frequency updates and large list stress tests. Compare context vs prop drilling
        for the same data. Measure re-render counts under load.
      </p>

      <Section title="6.1 High-Frequency Tick — 60fps Update">
        <Info>
          Auto-tick at ~60fps via <code>setInterval(16ms)</code>. All <code>TickDisplay</code> consumers
          re-render every tick — this is the expected but often surprising behavior.
          Context is NOT batching or debouncing. Every value change = re-render of all consumers.
        </Info>
        <Row style={{ marginBottom: 12 }}>
          <Btn onClick={() => setRunning(r => !r)} active={running}>
            {running ? 'stop' : 'start'} 60fps
          </Btn>
          <Btn onClick={() => setTick(t => t + 1)}>manual tick</Btn>
          <Btn onClick={() => setTick(0)}>reset</Btn>
          <span style={{ fontSize: 13, color: '#bbb' }}>tick: <b style={{ color: '#e0e0e0' }}>{tick}</b></span>
        </Row>
        <TickCtx.Provider value={tick}>
          <Row>
            <TickDisplay id={1} />
            <TickDisplay id={2} />
            <TickDisplay id={3} />
          </Row>
        </TickCtx.Provider>
        <Pre>{`// Every setInterval(16ms) fires setTick → new context value → all consumers re-render
// At 60fps: 60 re-renders/second per consumer
// For 3 consumers: 180 renders/second
// Context is NOT for high-frequency animation state — use useRef + requestAnimationFrame instead`}</Pre>
      </Section>

      <Section title="6.2 Typing Input — Per-Keystroke Context Update">
        <Info>
          Every keystroke updates context. Each <code>InputMirror</code> re-renders on every character.
          With 3 mirrors: 3x render cost per keystroke. Acceptable for small subtrees, destructive at scale.
        </Info>
        <Row style={{ marginBottom: 12 }}>
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="type here…"
            style={{
              background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#e0e0e0',
              padding: '5px 10px', borderRadius: 3, fontSize: 13, outline: 'none', width: 200,
            }}
          />
          <Btn onClick={() => setInputVal('')}>clear</Btn>
          <span style={{ fontSize: 12, color: '#555' }}>len: {inputVal.length}</span>
        </Row>
        <InputCtx.Provider value={inputVal}>
          <Row>
            <InputMirror id={1} />
            <InputMirror id={2} />
            <InputMirror id={3} />
          </Row>
        </InputCtx.Provider>
        <Pre>{`// Consider: is context the right tool for ephemeral UI state?
// Alternatives for typing/focus/hover state:
// - Local useState (no context needed if used in one component)
// - useRef (no re-render at all — sync DOM directly)
// - Debounced context (fire update every 300ms, not every keystroke)`}</Pre>
      </Section>

      <Section title="6.3 Large List — Context vs Prop Drilling">
        <Info>
          Context consumer and prop drilling consumer side by side. Both re-render when list changes.
          The render count difference is minimal here — the real cost is in React reconciling {listSize} items,
          not in the context vs prop mechanism. Context wins on DX, not performance, for list data.
        </Info>
        <Row style={{ marginBottom: 12 }}>
          <Btn onClick={() => setListSize(100)}>100 items</Btn>
          <Btn onClick={() => setListSize(500)}>500 items</Btn>
          <Btn onClick={() => setListSize(1000)}>1000 items</Btn>
          <Btn onClick={() => setListVersion(v => v + 1)}>regenerate</Btn>
        </Row>
        <ListCtx.Provider value={items}>
          <Row style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <LargeListConsumer label="context consumer" />
            <PropListConsumer items={items} />
          </Row>
        </ListCtx.Provider>
        <Pre>{`// For large static lists, context vs props is a wash on performance.
// Key insight: the bottleneck is React reconciling {${listSize}} <ListItem> components,
// not the context subscription mechanism itself.
// Use React.memo on ListItem to avoid re-reconciling unchanged items.`}</Pre>
      </Section>
    </div>
  )
}
