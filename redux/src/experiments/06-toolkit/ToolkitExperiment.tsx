import { useRef, useState } from 'react'
import { createSlice, createAsyncThunk, configureStore } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { Provider, useSelector, useDispatch } from 'react-redux'
import { Btn, Row, Section, Info, Pre, Log, ui } from '../shared'

// ─── createSlice — counter ────────────────────────────────────────────────────
// Toolkit uses Immer under the hood — you CAN mutate `state` in reducers.
// Immer intercepts the mutation and produces a new immutable object.

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0, history: [] as number[] },
  reducers: {
    increment(state) {
      state.value += 1             // looks like mutation — Immer produces new object
      state.history.push(state.value)
    },
    decrement(state) {
      state.value -= 1
      state.history.push(state.value)
    },
    incrementBy(state, action: PayloadAction<number>) {
      state.value += action.payload
    },
    reset(state) {
      state.value = 0
      state.history = []
    },
  },
})

// ─── createAsyncThunk — async action creator with lifecycle actions ───────────
// Automatically creates: fetchUser.pending, fetchUser.fulfilled, fetchUser.rejected

const fetchUser = createAsyncThunk('user/fetch', async (id: number) => {
  await new Promise(r => setTimeout(r, 800))
  if (id === 0) throw new Error('ID 0 is invalid')
  return { id, name: `User #${id}`, email: `user${id}@example.com` }
})

type UserState = {
  data: { id: number; name: string; email: string } | null
  status: 'idle' | 'pending' | 'fulfilled' | 'rejected'
  error: string | null
}

const userSlice = createSlice({
  name: 'user',
  initialState: { data: null, status: 'idle', error: null } as UserState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchUser.pending, state => {
        state.status = 'pending'
        state.error = null
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = 'fulfilled'
        state.data = action.payload
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.status = 'rejected'
        state.error = action.error.message ?? 'Unknown error'
      })
  },
})

// ─── configureStore — combines slices, adds redux-thunk + DevTools ────────────

const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
    user: userSlice.reducer,
  },
  // devTools: true by default in development
  // middleware: [thunk] included by default
})

type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

// ─── Components ───────────────────────────────────────────────────────────────

function CounterPanel() {
  const { value, history } = useSelector((s: RootState) => s.counter)
  const dispatch = useDispatch<AppDispatch>()
  return (
    <div>
      <Row>
        <Btn onClick={() => dispatch(counterSlice.actions.decrement())}>−</Btn>
        <span style={{ fontSize: 28, minWidth: 48, textAlign: 'center' }}>{value}</span>
        <Btn onClick={() => dispatch(counterSlice.actions.increment())}>+</Btn>
        <Btn onClick={() => dispatch(counterSlice.actions.incrementBy(5))}>+5</Btn>
        <Btn onClick={() => dispatch(counterSlice.actions.reset())}>reset</Btn>
      </Row>
      <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
        history: [{history.join(', ')}]
      </div>
    </div>
  )
}

function UserPanel() {
  const { data, status, error } = useSelector((s: RootState) => s.user)
  const dispatch = useDispatch<AppDispatch>()
  const [id, setId] = useState(1)

  return (
    <div>
      <Row>
        <input
          style={{ ...ui.input, width: 60 }}
          type="number" value={id}
          onChange={e => setId(Number(e.target.value))}
        />
        <Btn onClick={() => dispatch(fetchUser(id))}>fetch user</Btn>
        <Btn onClick={() => dispatch(fetchUser(0))} danger>fetch invalid (id=0)</Btn>
      </Row>
      <div style={{ marginTop: 10, fontSize: 13 }}>
        status: <b style={{
          color: status === 'pending' ? '#f9a825'
            : status === 'fulfilled' ? '#4caf50'
            : status === 'rejected' ? '#ff6b6b'
            : '#666'
        }}>{status}</b>
      </div>
      {data && (
        <div style={{ marginTop: 6, fontSize: 13, color: '#7ec8a0' }}>
          {data.name} — {data.email}
        </div>
      )}
      {error && <div style={{ marginTop: 6, fontSize: 13, color: '#ff6b6b' }}>{error}</div>}
    </div>
  )
}

// ─── Boilerplate comparison ───────────────────────────────────────────────────

const RAW_REDUX = `// Raw Redux — counter increment:
const INCREMENT = 'counter/increment'

function counterReducer(state = { value: 0 }, action) {
  switch (action.type) {
    case INCREMENT: return { ...state, value: state.value + 1 }
    default: return state
  }
}

dispatch({ type: INCREMENT })`

const RTK_REDUX = `// Redux Toolkit — same thing:
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment(state) { state.value += 1 }  // Immer handles immutability
  }
})

dispatch(counterSlice.actions.increment())`

const ASYNC_COMPARISON = `// Raw Redux async action:
function fetchUser(id) {
  return async (dispatch) => {
    dispatch({ type: 'user/fetch/pending' })
    try {
      const data = await api.getUser(id)
      dispatch({ type: 'user/fetch/fulfilled', payload: data })
    } catch (err) {
      dispatch({ type: 'user/fetch/rejected', error: err.message })
    }
  }
}

// Redux Toolkit — same thing:
const fetchUser = createAsyncThunk('user/fetch', async (id) => {
  return await api.getUser(id)  // throw = rejected, return = fulfilled
})
// pending/fulfilled/rejected actions created automatically`


export default function ToolkitExperiment() {
  const [logs] = useState<string[]>([])

  return (
    <div>
      <h2 style={ui.h2}>6 · Redux Toolkit</h2>
      <p style={ui.desc}>
        Toolkit reduces boilerplate via <code>createSlice</code> (actions + reducer in one),
        <code> createAsyncThunk</code> (lifecycle actions), and <code>configureStore</code> (sane defaults).
        Immer enables direct mutations in reducers.
      </p>

      <Provider store={store}>
        <Section title="6.1 createSlice — counter with history">
          <Info>
            Immer lets you write mutations (<code>state.value += 1</code>).
            Internally it uses a Proxy to intercept mutations and produce a new immutable state object.
            You never escape immutability — you just don't have to write <code>{'{ ...state, value: state.value + 1 }'}</code>.
          </Info>
          <CounterPanel />
        </Section>

        <Section title="6.2 createAsyncThunk — lifecycle actions">
          <Info>
            <code>createAsyncThunk</code> wraps your async function and automatically dispatches
            <code> pending</code>, <code>fulfilled</code>, or <code>rejected</code> actions.
            Add <code>id=0</code> to trigger the rejected path.
          </Info>
          <UserPanel />
        </Section>

        <Section title="6.3 Boilerplate reduction — raw vs toolkit">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Pre>{RAW_REDUX}</Pre>
            <Pre>{RTK_REDUX}</Pre>
          </div>
        </Section>

        <Section title="6.4 Async boilerplate — raw vs toolkit">
          <Pre>{ASYNC_COMPARISON}</Pre>
        </Section>

        <Section title="6.5 Hidden costs of toolkit">
          <Info>Toolkit adds convenience but hides complexity:</Info>
          <Pre>{`// configureStore default middleware includes:
// - redux-thunk (async support)
// - serializability check middleware (warns if you dispatch non-serializable values)
// - immutability check middleware (warns if state is mutated outside reducers)
// These checks run in development only and add overhead.

// createAsyncThunk includes:
// - requestId generation (for race condition handling via action.meta.requestId)
// - AbortController integration (dispatch.abort() cancels the thunk)
// - condition option (skip dispatch if condition returns false)

// Immer adds:
// - Proxy overhead on every reducer call
// - Finalize pass to convert draft to immutable object
// In practice: negligible for typical apps, measurable at 100k+ state nodes.`}</Pre>
          <Log entries={logs} />
        </Section>
      </Provider>
    </div>
  )
}

