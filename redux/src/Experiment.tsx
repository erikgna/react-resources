import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

type State = { count: number; name: string }
type Action = { type: string; payload?: any }
type Listener = () => void
type Store = {
  getState: () => State
  dispatch: (action: Action) => Action
  subscribe: (fn: Listener) => () => void
}

function createStore(reducer: (state: State | undefined, action: Action) => State): Store {
  let state = reducer(undefined, { type: '@@INIT' })
  let listeners: Listener[] = []

  return {
    getState: () => state,
    dispatch: (action) => {
      state = reducer(state, action)
      listeners.forEach(fn => fn())
      return action
    },
    subscribe: (fn) => {
      listeners.push(fn)
      return () => { listeners = listeners.filter(l => l !== fn) }
    },
  }
}

function reducer(state: State = { count: 0, name: 'redux' }, action: Action): State {
  switch (action.type) {
    case 'INCREMENT': return { ...state, count: state.count + 1 }
    case 'SET_NAME':  return { ...state, name: action.payload }
    default:          return state
  }
}

const StoreContext = createContext<Store | null>(null)

function StoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<Store | null>(null)
  if (!storeRef.current) storeRef.current = createStore(reducer)
  return <StoreContext.Provider value={storeRef.current}>{children}</StoreContext.Provider>
}

function useSelector<T>(selector: (s: State) => T): T {
  const store = useContext(StoreContext)!

  const [, forceRender] = useState(0)

  const valueRef = useRef(selector(store.getState()))

  useEffect(() => {
    const checkForUpdate = () => {
      const newValue = selector(store.getState())

      if (newValue !== valueRef.current) {
        valueRef.current = newValue
        forceRender(n => n + 1)
      }
    }
    return store.subscribe(checkForUpdate)
  }, [store])

  return valueRef.current
}

function useDispatch() {
  return useContext(StoreContext)!.dispatch
}

function CounterBox() {
  const renders = useRef(0); renders.current++
  const count = useSelector(s => s.count)
  return (
    <div style={box}>
      <b>CounterBox</b> — renders: {renders.current}
      <div>count = {count}</div>
    </div>
  )
}

function NameBox() {
  const renders = useRef(0); renders.current++
  const name = useSelector(s => s.name)
  return (
    <div style={box}>
      <b>NameBox</b> — renders: {renders.current}
      <div>name = "{name}"</div>
    </div>
  )
}

function Controls() {
  const dispatch = useDispatch()
  const [text, setText] = useState('')
  return (
    <div style={{ marginBottom: 12 }}>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>increment count</button>{' '}
      <input value={text} onChange={e => setText(e.target.value)} placeholder="new name" />
      <button onClick={() => dispatch({ type: 'SET_NAME', payload: text })}>set name</button>
    </div>
  )
}

export default function SimpleReactReduxExperiment() {
  return (
    <StoreProvider>
      <h2>React + Redux — the equality check</h2>
      <p>
        Click "increment count" and watch the render numbers.
        Only CounterBox climbs. NameBox stays put — it doesn't use <code>count</code>,
        so useSelector's <code>if</code> skips its re-render.
      </p>
      <Controls />
      <div style={{ display: 'flex', gap: 12 }}>
        <CounterBox />
        <NameBox />
      </div>
    </StoreProvider>
  )
}

const box = { border: '1px solid #ccc', borderRadius: 8, padding: 12, minWidth: 160 }
