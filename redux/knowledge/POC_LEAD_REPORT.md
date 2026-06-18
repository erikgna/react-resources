# Redux POC — Report for Lead Review

**Engineer:** Erik Na
**Date:** 2026-06-18
**Repo path:** `react-resources/redux/`

---

## What This POC Explores

What Redux actually is underneath the library, built up one layer at a time. The
claim the POC proves: Redux is ~100 lines of plain JavaScript (state in a closure +
dispatch + subscribe), and everything else — combineReducers, middleware,
react-redux, Redux Toolkit — is composition on top of those three primitives.

The store engine is hand-written in `src/core/rawStore.ts` and mirrors the real
Redux source structure. The five experiments use it (and the real react-redux /
toolkit packages) to show each layer in isolation.

- **`createRawStore` / `combineReducers`** → `01-raw-store` — store with no React.
- **The equality check** → `02-manual-react` — why `useSelector` needs it.
- **react-redux as a binding layer** → `03-react-redux` — our store, their hooks.
- **Middleware + thunk** → `04-middleware` — wrapping dispatch.
- **Redux Toolkit** → `05-toolkit` — the same machine, generated for you.

---

## Architecture

```
App.tsx ─ left-nav tabs, one experiment mounted at a time
  ├─ 01 Raw Store     createRawStore + combineReducers, no library
  ├─ 02 Manual React  store in context; selector hook A (no eq) vs B (eq check)
  ├─ 03 React-Redux   real <Provider>/useSelector over OUR createRawStore
  ├─ 04 Middleware    applyMiddleware(logger, thunk, errorInterceptor)
  └─ 05 Toolkit       createSlice + createAsyncThunk + configureStore

Core: src/core/rawStore.ts — createStore, combineReducers, compose, applyMiddleware.
Read this file first; the experiments are just drivers for it.
```

---

## The Core Concept: state in a closure, changed only by dispatch

Redux is three ideas:

1. State lives in ONE object held in a closure — not in React.
2. The only way to change it is `dispatch(action)` → `reducer(state, action)`.
3. After each change, every subscriber is notified so the UI can re-read.

```
dispatch(action) → reducer(state, action) → new state → notify listeners → UI re-reads
```

The reducer is a pure function `(state, action) => newState`. No mutation, no
async, no side effects. That purity is what makes time-travel, logging, and
predictable updates possible.

---

## Key Concepts

### The store is a closure, not a framework
`createRawStore` holds `state` and `listeners` in local variables. The only access
is through the returned `getState` / `dispatch` / `subscribe`. No classes, no React,
no magic — that closure IS the store.

### Reference identity drives change detection
A reducer returns a NEW object on change and the SAME reference on no-change.
Components compare references (`Object.is`) to decide whether to re-render. This is
why mutating state is a silent bug: same reference → the UI never updates.

### The equality check is the whole point of useSelector (experiment 2)
The naive selector hook calls `setState` on every dispatch, re-rendering every
subscriber. Adding one `if (!Object.is(prev, next))` gate makes a component
re-render only when ITS selected slice changes. react-redux's `useSelector` is that
gate, hardened for selector-identity changes, custom equality, and React 18 tearing.

### react-redux is just a binding layer (experiment 3)
We hand react-redux's `<Provider>` our own `createRawStore` — not Redux's
`createStore` — and `useSelector` / `useDispatch` work unchanged. react-redux only
needs the shape `{ getState, dispatch, subscribe }`.

### Middleware composes around dispatch; thunk is 4 lines (experiment 4)
`applyMiddleware` composes functions around `store.dispatch`. An action flows
logger → thunk → reducer and the return unwinds back out. The entire redux-thunk:
`store => next => action => typeof action === 'function' ? action(dispatch, getState) : next(action)`.

### Toolkit is the same machine, generated (experiment 5)
`createSlice` (reducer + actions, Immer for "mutating" syntax), `createAsyncThunk`
(thunk + auto pending/fulfilled/rejected), `configureStore` (combineReducers + thunk
+ devtools defaulted). Nothing new conceptually — the form you actually ship.

---

## When Redux Helps (the honest boundary)

| Scenario | Redux | Note |
|---|---|---|
| shared state across distant components | strong ✅ | one store, any subscriber |
| predictable / auditable state changes | strong ✅ | pure reducers, action log |
| local component-only state | overkill | `useState` is simpler |
| server cache (fetch + cache + revalidate) | weak | RTK Query / React Query fit better |
| high-frequency derived values | needs care | memoize selectors (reselect) |

---

## What's Still Shallow

1. **No automated tests.** Experiments are interactive (click, watch render counts).
2. **No quantified benchmark.** The earlier POC had perf/stress/race experiments;
   they were removed to keep the focus on *understanding the core*. This is a
   teaching POC, not a measurement harness.
3. **rawStore is a faithful subset, not real Redux.** It omits `replaceReducer`,
   store-observable, and the no-op reference preservation in `combineReducers`. The
   real `useSelector` / `applyMiddleware` are more defensive. Behavior matches for
   the demonstrated paths; edge cases are not covered.
4. **The `redux` package itself is unused.** `react-redux` and `@reduxjs/toolkit`
   are real; the base store is hand-written to expose the internals.

---

## Files

| File | Role |
|------|------|
| `src/core/rawStore.ts` | The engine — createStore, combineReducers, compose, applyMiddleware (read first) |
| `src/App.tsx` | Tab nav, mounts one experiment at a time |
| `src/experiments/01-raw-store/RawStoreExperiment.tsx` | Store with no React; combineReducers |
| `src/experiments/02-manual-react/ManualReactExperiment.tsx` | Equality-check lesson (A vs B hook) |
| `src/experiments/03-react-redux/ReactReduxExperiment.tsx` | react-redux as a binding layer over our store |
| `src/experiments/04-middleware/MiddlewareExperiment.tsx` | applyMiddleware: logger + thunk pipeline |
| `src/experiments/05-toolkit/ToolkitExperiment.tsx` | createSlice / createAsyncThunk / configureStore |
| `knowledge/TECHNICAL.md` | Deep technical reference |
