function createStore(reducer) {
  let state = reducer(undefined, { type: '@@INIT' })
  let listeners = []

  function getState() {
    return state
  }

  function dispatch(action) {
    state = reducer(state, action)

    for (const listener of listeners) {
      listener()
    }

    return action
  }

  function subscribe(listener) {
    listeners.push(listener)

    return function unsubscribe() {
      listeners = listeners.filter(l => l !== listener)
    }
  }

  return { getState, dispatch, subscribe }
}

function combineReducers(reducers) {
  return function rootReducer(state = {}, action) {
    const nextState = {}

    for (const key of Object.keys(reducers)) {
      const sliceReducer = reducers[key]
      const sliceState = state[key]
      nextState[key] = sliceReducer(sliceState, action)
    }

    return nextState
  }
}

function loggerMiddleware(store) {
  return function wrapDispatch(next) {
    return function handleAction(action) {
      console.log('about to dispatch:', action.type)
      const result = next(action)
      console.log('new state is:', store.getState())
      return result
    }
  }
}

function thunkMiddleware(store) {
  return function wrapDispatch(next) {
    return function handleAction(action) {
      if (typeof action === 'function') {
        return action(store.dispatch, store.getState)
      }
      return next(action)
    }
  }
}

function applyMiddleware(store, middlewares) {
  const api = {
    getState: store.getState,
    dispatch: (action) => dispatch(action),
  }

  const chain = middlewares.map(middleware => middleware(api))

  let dispatch = store.dispatch
  for (let i = chain.length - 1; i >= 0; i--) {
    dispatch = chain[i](dispatch)
  }

  return { ...store, dispatch }
}

function counterReducer(state = { count: 0 }, action) {
  switch (action.type) {
    case 'INCREMENT': return { count: state.count + 1 }
    case 'DECREMENT': return { count: state.count - 1 }
    default:          return state
  }
}

let store = createStore(counterReducer)

store = applyMiddleware(store, [loggerMiddleware, thunkMiddleware])

const unsubscribe = store.subscribe(() => {
})

console.log('--- dispatch INCREMENT ---')
store.dispatch({ type: 'INCREMENT' })

console.log('--- dispatch INCREMENT again ---')
store.dispatch({ type: 'INCREMENT' })

console.log('--- dispatch an async thunk ---')
store.dispatch((dispatch, getState) => {
  console.log('  inside thunk, current count:', getState().count)
  setTimeout(() => {
    dispatch({ type: 'DECREMENT' })
  }, 100)
})

unsubscribe()
