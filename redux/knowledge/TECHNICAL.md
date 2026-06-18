# Redux POC — Technical Reference

## What This Is

A Vite + React 19 app that rebuilds Redux from first principles, then layers the
real ecosystem on top. The store engine (`createStore`, `combineReducers`, `compose`,
`applyMiddleware`) is hand-written in `src/core/rawStore.ts` — ~150 lines including
teaching comments — and mirrors the real Redux source structure. Five experiments
drive it, each isolating one layer.

The thesis: **Redux is plain JavaScript.** State lives in a closure; `dispatch`
runs a pure reducer and notifies subscribers; everything else is composition.

```
dispatch(action) → reducer(state, action) → new state → notify listeners → UI re-reads
```

Stack: React 19, react-redux 9, @reduxjs/toolkit 2, TypeScript 5.6, Vite 6. The
`redux` package is installed but unused — the base store is hand-written on purpose.

---

## The Engine: `src/core/rawStore.ts`

### createRawStore

```ts
function createRawStore<S>(reducer, enhancer?) {
  if (enhancer) return enhancer(createRawStore)(reducer)  // applyMiddleware path
  let state = reducer(undefined, { type: '@@INIT' })       // seed via default param
  let listeners = []
  let isDispatching = false
  return { getState, dispatch, subscribe }
}
```

- **State and listeners live in the closure.** The returned methods are the only
  access. That closure IS the store — no class, no React.
- **Initial state** comes from calling the reducer with `undefined`; each reducer's
  default parameter (`state = {...}`) answers with its starting value.
- **`isDispatching` guard** rejects reentrant `dispatch`/`getState`. A reducer that
  dispatches would re-enter mid-reduce → infinite loop / corrupt state.
- **dispatch** runs `state = reducer(state, action)` in try/finally, then notifies a
  **snapshot** of the listener list (`[...listeners]`) so subscribe/unsubscribe
  during the pass doesn't change who gets called this round.
- **subscribe** copy-on-writes the array (`[...listeners, l]`) for the same snapshot
  safety, and returns an unsubscribe closure.

### combineReducers

```ts
function combineReducers(reducers) {
  return (state = {}, action) =>
    Object.keys(reducers).reduce((next, k) => {
      next[k] = reducers[k](state[k], action)   // each reducer sees ONLY its slice
      return next
    }, {})
}
```

- Folds many slice-reducers into one root reducer. Each owns one top-level key and
  never sees sibling state.
- **Simplification vs real Redux:** this always builds a new object. Real Redux
  returns the old state reference when no slice changed (a re-render optimization).

### compose + applyMiddleware

```ts
compose(f, g, h)(x) === f(g(h(x)))

function applyMiddleware(...middlewares) {
  return (createFn) => (reducer) => {
    const store = createFn(reducer)
    let dispatch = () => { throw Error('dispatching during construction') }
    const api = { getState: store.getState, dispatch: (a) => dispatch(a) }
    const chain = middlewares.map(m => m(api))
    dispatch = compose(...chain)(store.dispatch)
    return { ...store, dispatch }
  }
}
```

- An **enhancer wraps createStore itself**: `createRawStore(reducer, applyMiddleware(...))`
  re-enters the top branch so middleware can replace `dispatch`.
- `api.dispatch` is the **wrapper**, not raw `store.dispatch` — so a middleware that
  re-dispatches (a thunk dispatching another thunk) goes back through the WHOLE chain.
- `compose` nests the chain: the **first listed middleware is the outermost wrapper**
  (sees the action first, the result last); `store.dispatch` sits at the center.

---

## 01 Raw Store: `RawStoreExperiment.tsx`

```tsx
const rootReducer = combineReducers({ counter: counterReducer, todos: todoReducer })
const store = useRef(createRawStore(rootReducer)).current   // create ONCE
```

- No library. Counter + todos in one store via `combineReducers`.
- **`useRef` to create the store once** — a new store per render would reset state
  and orphan subscriptions.
- The React bridge is one hook:

```tsx
function useRawSelector(store, selector) {
  const [value, setValue] = useState(() => selector(store.getState()))
  useEffect(() => store.subscribe(() => setValue(selector(store.getState()))), [store])
  return value
}
```

- Naive on purpose: fires `setValue` on **every** dispatch, even when the selected
  value didn't change. Experiment 2 fixes this.

---

## 02 Manual React: `ManualReactExperiment.tsx`

Store goes into React context (like react-redux's `<Provider>`). Two selector hooks,
side by side:

```tsx
// A — no equality check: re-renders on EVERY dispatch
useEffect(() => store.subscribe(() => setValue(selector(store.getState()))), [])

// B — equality check: re-renders only when THIS value changes
useEffect(() => store.subscribe(() => {
  const next = selector(store.getState())
  if (!Object.is(valRef.current, next)) { valRef.current = next; forceRender() }
}), [])
```

- Dispatch "increment counter": the A-boxes for name/unrelated still bump their
  render count; the B-boxes stay put. **That one `if` is react-redux's core trick.**
- B uses `useReducer(c => c + 1, 0)` as a `forceRender` and holds the value in a ref —
  so the render is driven only by the equality gate, not by every notification.

---

## 03 React-Redux: `ReactReduxExperiment.tsx`

```tsx
import { Provider, useSelector, useDispatch, shallowEqual } from 'react-redux'
const store = createRawStore(reducer)   // OUR store, not Redux's createStore

<Provider store={store as ...}>
  ... useSelector((s) => s.counter) ...
</Provider>
```

- **Proof react-redux is a binding layer:** it accepts any `{ getState, dispatch,
  subscribe }`. Our hand-written store works with the real `<Provider>` unchanged.
- The demo is about **selector equality** — the #1 cause of accidental re-renders:

| selector | behavior |
|---|---|
| `s => s.counter` (primitive) | re-renders only when counter changes ✅ |
| `s => ({ count: s.counter })` (new object) | re-renders on EVERY dispatch ❌ |
| same, `shallowEqual` | re-renders only when counter changes ✅ |
| `s => s.name` (other slice) | unaffected by counter ✅ |

- Real `useSelector` adds what experiment 2 omits: selector-identity handling,
  custom equality, and `useSyncExternalStore` for React 18 tearing safety.

---

## 04 Middleware: `MiddlewareExperiment.tsx`

```tsx
createRawStore(reducer, applyMiddleware(
  makeLogger(addLog),          // outermost — first on dispatch, last on return
  thunk,                       // intercepts function actions
  makeErrorInterceptor(addLog) // innermost — closest to reducer
))
```

- **Order = nesting.** `logger(thunk(errorInterceptor(store.dispatch)))`. Action flows
  left→right in; result unwinds right→left out.
- **The entire redux-thunk:**

```tsx
const thunk = store => next => action =>
  typeof action === 'function'
    ? action(store.dispatch, store.getState)   // call the thunk
    : next(action)                             // plain action — pass through
```

- A thunk is a function dispatched instead of an object → async actions. The store
  glue here mirrors whole state into local state on each dispatch (coarser than a
  selector, fine for the demo); `useRef(store.subscribe(...))` runs subscribe once.

---

## 05 Toolkit: `ToolkitExperiment.tsx`

```tsx
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0, history: [] },
  reducers: { increment(state) { state.value += 1 } },  // Immer → immutable update
})

const fetchUser = createAsyncThunk('user/fetch', async (id) => { ... })  // auto lifecycle

const store = configureStore({ reducer: { counter: counterSlice.reducer, user: userSlice.reducer } })
```

- Everything from experiments 1–4, generated:
  - `createSlice` → reducer + action creators in one. **Immer** lets you write
    `state.value += 1` (a Proxy intercepts the mutation and produces a new object) —
    you never actually escape immutability.
  - `createAsyncThunk` → the experiment-4 thunk + auto `pending` / `fulfilled` /
    `rejected` actions (handled in `extraReducers`). `id === 0` triggers the rejected
    path.
  - `configureStore` → `combineReducers` + thunk middleware + devtools, defaulted.
- Same store, same dispatch, same selectors. This is the form you ship.

---

## Build / Run

```bash
cd redux
npm install
npm run dev      # vite dev server (esbuild, no typecheck)
npm run build    # tsc -b && vite build
npx tsc -p tsconfig.app.json --noEmit   # typecheck only
```

---

## When Redux Helps (the honest boundary)

| Scenario | Redux | Note |
|---|---|---|
| shared state across distant components | strong ✅ | one store, any subscriber |
| predictable / auditable state changes | strong ✅ | pure reducers, action log |
| local component-only state | overkill | `useState` is simpler |
| server cache (fetch + cache + revalidate) | weak | RTK Query / React Query fit better |
| high-frequency derived values | needs care | memoize selectors (reselect) |

Redux will NOT replace local state, fix mutation bugs (mutation is a silent failure —
same reference, no re-render), or cache server data for free. It WILL give shared,
predictable, auditable state with a tiny core you can read in one sitting.

---

## File Reference

| File | Role |
|------|------|
| `src/core/rawStore.ts` | The engine — createStore, combineReducers, compose, applyMiddleware |
| `src/App.tsx` | Tab nav, mounts one experiment at a time |
| `src/experiments/01-raw-store/RawStoreExperiment.tsx` | Store with no React; combineReducers; naive selector hook |
| `src/experiments/02-manual-react/ManualReactExperiment.tsx` | Equality-check lesson (hook A vs B) |
| `src/experiments/03-react-redux/ReactReduxExperiment.tsx` | react-redux binding layer over our store; selector equality |
| `src/experiments/04-middleware/MiddlewareExperiment.tsx` | applyMiddleware: logger + thunk pipeline |
| `src/experiments/05-toolkit/ToolkitExperiment.tsx` | createSlice / createAsyncThunk / configureStore |
| `knowledge/POC_LEAD_REPORT.md` | Lead summary + boundary + what's shallow |
