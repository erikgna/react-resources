import { useRef } from 'react'
import { atom, selector, atomFamily, selectorFamily, useRecoilState, useRecoilValue, RecoilRoot } from 'recoil'
import {
  atomFamily as coreAtomFamily,
  selectorFamily as coreSelectorFamily,
  useRecoilState as coreUseState,
  useRecoilValue as coreUseValue,
  RecoilRoot as CoreRoot,
} from '../../core/recoil'
import { Section, Row, Btn, Info, Pre } from '../shared'

// ─── Data model ───────────────────────────────────────────────────────────────

interface TodoItem { id: number; text: string; done: boolean }

// ─── atomFamily: one atom per todo ID ────────────────────────────────────────

const todoAtom = atomFamily<TodoItem, number>({
  key: '05/todo',
  default: id => ({ id, text: `Task ${id}`, done: false }),
})

const todoIdsAtom = atom<number[]>({ key: '05/todoIds', default: [1, 2, 3] })

// ─── selectorFamily: derived state per todo ───────────────────────────────────

const todoDoneSelector = selectorFamily<boolean, number>({
  key: '05/todoDone',
  get: id => ({ get }) => get(todoAtom(id)).done,
})

// ─── Aggregate selector ───────────────────────────────────────────────────────

const todoStatsSelector = selector({
  key: '05/todoStats',
  get: ({ get }) => {
    const ids = get(todoIdsAtom)
    const todos = ids.map(id => get(todoAtom(id)))
    return {
      total: todos.length,
      done: todos.filter(t => t.done).length,
      pending: todos.filter(t => !t.done).length,
    }
  },
})

// ─── selectorFamily for filtered list ────────────────────────────────────────

type FilterMode = 'all' | 'done' | 'pending'

const filteredTodosSelector = selectorFamily<TodoItem[], FilterMode>({
  key: '05/filteredTodos',
  get: mode => ({ get }) => {
    const ids = get(todoIdsAtom)
    const todos = ids.map(id => get(todoAtom(id)))
    if (mode === 'done') return todos.filter(t => t.done)
    if (mode === 'pending') return todos.filter(t => !t.done)
    return todos
  },
})

// ─── Core families ────────────────────────────────────────────────────────────

interface Score { id: string; points: number }

const coreScoreAtom = coreAtomFamily<Score, string>({
  key: 'core-05/score',
  default: id => ({ id, points: 0 }),
})

const coreDoubledSel = coreSelectorFamily<number, string>({
  key: 'core-05/doubled',
  get: id => ({ get }) => get(coreScoreAtom(id)).points * 2,
})

// ─── 5.1 atomFamily: per-ID atoms ────────────────────────────────────────────

function TodoRow({ id }: { id: number }) {
  const [todo, setTodo] = useRecoilState(todoAtom(id))
  const renders = useRef(0); renders.current++
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0' }}>
      <input
        type="checkbox"
        checked={todo.done}
        onChange={e => setTodo(t => ({ ...t, done: e.target.checked }))}
        style={{ accentColor: '#4a9eff' }}
      />
      <span style={{
        color: todo.done ? '#444' : '#e0e0e0', fontSize: 13,
        textDecoration: todo.done ? 'line-through' : 'none',
      }}>
        {todo.text}
      </span>
      <span style={{ color: '#555', fontSize: 11, marginLeft: 'auto' }}>renders: {renders.current}</span>
    </div>
  )
}

function TodoStats() {
  const stats = useRecoilValue(todoStatsSelector)
  return (
    <div style={{ fontSize: 12, color: '#666', display: 'flex', gap: 16 }}>
      <span>total: <span style={{ color: '#e0e0e0' }}>{stats.total}</span></span>
      <span>done: <span style={{ color: '#4caf50' }}>{stats.done}</span></span>
      <span>pending: <span style={{ color: '#f5a623' }}>{stats.pending}</span></span>
    </div>
  )
}

function TodoListDemo() {
  const [ids, setIds] = useRecoilState(todoIdsAtom)
  const nextId = useRef(4)
  return (
    <Section title="5.1 — atomFamily: one atom per entity ID">
      <Info>atomFamily returns a function. Calling it with an ID gives the atom for that entity. Each todo has its own atom — toggling one does NOT re-render other TodoRow components.</Info>
      <TodoStats />
      <div style={{ marginTop: 10, marginBottom: 8 }}>
        {ids.map(id => <TodoRow key={id} id={id} />)}
      </div>
      <Row>
        <Btn onClick={() => { setIds(i => [...i, nextId.current]); nextId.current++ }}>Add todo</Btn>
        <Btn onClick={() => setIds(i => i.slice(0, -1))} danger>Remove last</Btn>
      </Row>
      <Pre>{`const todoAtom = atomFamily<TodoItem, number>({
  key: 'todo',
  default: id => ({ id, text: \`Task \${id}\`, done: false }),
})

// Usage: todoAtom(1), todoAtom(2), todoAtom(3)
// Each call returns the SAME atom descriptor for the same ID
// (cached by the factory — no duplicate atom keys)`}</Pre>
    </Section>
  )
}

// ─── 5.2 selectorFamily ───────────────────────────────────────────────────────

function FilteredList({ mode }: { mode: FilterMode }) {
  const todos = useRecoilValue(filteredTodosSelector(mode))
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {todos.length === 0
        ? <span style={{ color: '#444', fontSize: 12 }}>— empty —</span>
        : todos.map(t => (
          <span key={t.id} style={{
            background: t.done ? '#0f2a1a' : '#1e1e1e',
            border: `1px solid ${t.done ? '#2a5a3a' : '#2a2a2a'}`,
            color: t.done ? '#4caf50' : '#c0c0c0',
            borderRadius: 3, padding: '3px 8px', fontSize: 12,
          }}>
            {t.text}
          </span>
        ))
      }
    </div>
  )
}

function SelectorFamilyDemo() {
  return (
    <Section title="5.2 — selectorFamily: parameterized derived state">
      <Info>selectorFamily(mode) gives a separate cached selector per mode. Toggle todos above — these lists update reactively through the same atomFamily.</Info>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(['all', 'done', 'pending'] as FilterMode[]).map(mode => (
          <div key={mode}>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{mode}</div>
            <FilteredList mode={mode} />
          </div>
        ))}
      </div>
      <Pre>{`const filteredTodosSelector = selectorFamily<TodoItem[], FilterMode>({
  key: 'filteredTodos',
  get: mode => ({ get }) => {
    const ids = get(todoIdsAtom)
    return ids.map(id => get(todoAtom(id)))
              .filter(t => mode === 'all' || t.done === (mode === 'done'))
  }
})

// filteredTodosSelector('done')    → one cached selector
// filteredTodosSelector('pending') → another cached selector
// Cache is per-param — same param always returns same selector node`}</Pre>
    </Section>
  )
}

// ─── 5.3 Dynamic todo with selectorFamily for badge ──────────────────────────

function DoneCountBadge({ id }: { id: number }) {
  const done = useRecoilValue(todoDoneSelector(id))
  return (
    <span style={{
      background: done ? '#0f2a1a' : '#2a1a0f',
      color: done ? '#4caf50' : '#f5a623',
      borderRadius: 3, padding: '2px 6px', fontSize: 10,
    }}>
      {done ? 'done' : 'todo'}
    </span>
  )
}

function IndividualBadgesDemo() {
  const ids = useRecoilValue(todoIdsAtom)
  return (
    <Section title="5.3 — selectorFamily per-entity badge">
      <Info>DoneCountBadge uses todoDoneSelector(id) — a selectorFamily parameterized by id. Each badge subscribes only to its own todo atom.</Info>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {ids.map(id => (
          <div key={id} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#888' }}>#{id}</span>
            <DoneCountBadge id={id} />
          </div>
        ))}
      </div>
      <Pre>{`const todoDoneSelector = selectorFamily<boolean, number>({
  key: 'todoDone',
  get: id => ({ get }) => get(todoAtom(id)).done,
})

// Each badge reads selectorFamily(id) — its own reactive selector
// Toggling todo #2 only re-renders the badge for id=2`}</Pre>
    </Section>
  )
}

// ─── 5.4 Core family reimplementation ────────────────────────────────────────

const PLAYER_IDS = ['alice', 'bob', 'carol']

function PlayerScore({ id }: { id: string }) {
  const [score, setScore] = coreUseState(coreScoreAtom(id))
  const doubled = coreUseValue(coreDoubledSel(id))
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '3px 0' }}>
      <span style={{ color: '#666', fontSize: 12, width: 44 }}>{id}</span>
      <Btn onClick={() => setScore(s => ({ ...s, points: s.points - 1 }))} danger>−</Btn>
      <span style={{ color: '#e0e0e0', fontSize: 13, minWidth: 24, textAlign: 'center' }}>{score.points}</span>
      <Btn onClick={() => setScore(s => ({ ...s, points: s.points + 1 }))}>+</Btn>
      <span style={{ color: '#555', fontSize: 11 }}>×2 = <span style={{ color: '#4a9eff' }}>{doubled}</span></span>
    </div>
  )
}

function CoreFamilyDemo() {
  return (
    <Section title="5.4 — core/recoil.ts — atomFamily + selectorFamily">
      <Info>atomFamily returns a closure that maps param → AtomNode via a JSON-keyed cache. The cache ensures the same param always returns the same atom descriptor.</Info>
      <div>
        {PLAYER_IDS.map(id => <PlayerScore key={id} id={id} />)}
      </div>
      <Pre>{`// core/recoil.ts
function atomFamily<T, P>(config) {
  const cache = new Map<string, AtomNode<T>>()
  return (param: P): AtomNode<T> => {
    const k = JSON.stringify(param)    // stable cache key
    if (!cache.has(k)) {
      cache.set(k, atom({
        key: config.key + '__' + k,    // unique global key
        default: typeof config.default === 'function'
          ? config.default(param)
          : config.default,
      }))
    }
    return cache.get(k)!
  }
}`}</Pre>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function FamiliesExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>05 · Families</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        <code>atomFamily</code> and <code>selectorFamily</code> create parameterized atoms and selectors — one per unique parameter.
        Essential for list-of-items state where each item needs its own independent subscription.
      </p>
      <RecoilRoot>
        <TodoListDemo />
        <SelectorFamilyDemo />
        <IndividualBadgesDemo />
      </RecoilRoot>
      <CoreRoot>
        <CoreFamilyDemo />
      </CoreRoot>
    </div>
  )
}
