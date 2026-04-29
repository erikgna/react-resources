/* eslint-disable @typescript-eslint/no-explicit-any */

// Manual Redux implementation — mirrors the real Redux source structure.
// Read this file to understand what redux actually does.

export type Action = { type: string; payload?: unknown }
export type Reducer<S> = (state: S | undefined, action: Action) => S
export type Listener = () => void
export type MiddlewareAPI = { getState: () => any; dispatch: (a: any) => any }
export type Middleware = (api: MiddlewareAPI) => (next: (a: any) => any) => (action: any) => any

export interface RawStore<S> {
  getState(): S
  dispatch(action: Action): Action
  subscribe(listener: Listener): () => void
}

export function createRawStore<S>(reducer: Reducer<S>, enhancer?: any): RawStore<S> {
  // Enhancer wraps createStore itself — used by applyMiddleware.
  if (enhancer) return enhancer(createRawStore)(reducer)

  let state: S = reducer(undefined, { type: '@@INIT' })
  // Snapshot the listener list before each notification so mutations during
  // iteration (add/remove in a listener) don't affect the current pass.
  let listeners: Listener[] = []
  let isDispatching = false

  return {
    getState(): S {
      if (isDispatching) throw new Error('Cannot call getState while dispatching.')
      return state
    },

    dispatch(action: Action): Action {
      if (isDispatching) throw new Error('Reducers may not dispatch actions.')
      try {
        isDispatching = true
        state = reducer(state, action)
      } finally {
        isDispatching = false
      }
      const snapshot = [...listeners]
      snapshot.forEach(l => l())
      return action
    },

    subscribe(listener: Listener): () => void {
      listeners = [...listeners, listener]
      return () => {
        listeners = listeners.filter(l => l !== listener)
      }
    },
  }
}

// Each reducer handles its own slice. combineReducers composes them into one.
export function combineReducers<S extends Record<string, any>>(
  reducers: { [K in keyof S]: Reducer<S[K]> }
): Reducer<S> {
  return (state = {} as S, action: Action): S =>
    (Object.keys(reducers) as (keyof S)[]).reduce((next, k) => {
      next[k] = reducers[k](state[k], action)
      return next
    }, {} as S)
}

// Functional composition: compose(f, g, h)(x) === f(g(h(x)))
export function compose(...fns: any[]): any {
  if (fns.length === 0) return (x: any) => x
  if (fns.length === 1) return fns[0]
  return fns.reduce((a, b) => (...args: any[]) => a(b(...args)))
}

// Wraps dispatch with a chain of middleware functions.
// Each middleware has signature: store => next => action => result
// They form a pipeline: action flows left-to-right through the chain.
export function applyMiddleware(...middlewares: Middleware[]) {
  return (createFn: any) => (reducer: any): RawStore<any> => {
    const store = createFn(reducer)

    // Placeholder dispatch during construction to catch middleware that
    // tries to dispatch synchronously while the chain is being built.
    let dispatch: any = () => {
      throw new Error('Dispatching while constructing middleware is not allowed.')
    }

    const api: MiddlewareAPI = {
      getState: store.getState,
      // Use wrapper so middlewares always call the final composed dispatch,
      // enabling thunks to dispatch further thunks.
      dispatch: (a: any) => dispatch(a),
    }

    const chain = middlewares.map(m => m(api))
    // compose wires the chain: first middleware wraps all others.
    dispatch = compose(...chain)(store.dispatch)

    return { ...store, dispatch }
  }
}
