import { makeAutoObservable } from 'mobx'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Section, Row, Btn, Info, Pre, Log } from '../shared'

// ─── 6.1 TodoStore with makeAutoObservable ────────────────────────────────────

interface Todo {
  id: number
  text: string
  done: boolean
}

class TodoStore {
  todos: Todo[] = []
  filter: 'all' | 'done' | 'active' = 'all'
  private _nextId = 1

  constructor() { makeAutoObservable(this) }

  addTodo(text: string) {
    this.todos.push({ id: this._nextId++, text, done: false })
  }

  toggleTodo(id: number) {
    const todo = this.todos.find(t => t.id === id)
    if (todo) todo.done = !todo.done
  }

  removeTodo(id: number) {
    this.todos.splice(this.todos.findIndex(t => t.id === id), 1)
  }

  setFilter(f: typeof this.filter) { this.filter = f }

  get filtered() {
    if (this.filter === 'done') return this.todos.filter(t => t.done)
    if (this.filter === 'active') return this.todos.filter(t => !t.done)
    return this.todos
  }

  get doneCount() { return this.todos.filter(t => t.done).length }
  get activeCount() { return this.todos.filter(t => !t.done).length }
}

const todoStore = new TodoStore()

const TodoItem = observer(function TodoItem({ todo }: { todo: Todo }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0' }}>
      <input type="checkbox" checked={todo.done} onChange={() => todoStore.toggleTodo(todo.id)} />
      <span style={{ color: todo.done ? '#555' : '#e0e0e0', textDecoration: todo.done ? 'line-through' : 'none', fontSize: 13 }}>
        {todo.text}
      </span>
      <Btn onClick={() => todoStore.removeTodo(todo.id)} danger>✕</Btn>
    </div>
  )
})

const TodoList = observer(function TodoList() {
  const [input, setInput] = useState('')
  return (
    <div>
      <Row style={{ marginBottom: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { todoStore.addTodo(input.trim()); setInput('') } }}
          placeholder="Add todo (Enter)..."
          style={{ background: '#111', border: '1px solid #2a2a2a', color: '#e0e0e0', padding: '5px 9px', borderRadius: 3, fontSize: 13, flex: 1 }}
        />
        <Btn onClick={() => { if (input.trim()) { todoStore.addTodo(input.trim()); setInput('') } }}>Add</Btn>
      </Row>
      <Row style={{ marginBottom: 8 }}>
        {(['all', 'active', 'done'] as const).map(f => (
          <Btn key={f} onClick={() => todoStore.setFilter(f)}>
            {f} {todoStore.filter === f ? '←' : ''}
          </Btn>
        ))}
        <span style={{ color: '#555', fontSize: 12 }}>done: {todoStore.doneCount} active: {todoStore.activeCount}</span>
      </Row>
      {todoStore.filtered.map(todo => <TodoItem key={todo.id} todo={todo} />)}
    </div>
  )
})

function TodoStoreSection() {
  return (
    <Section title="6.1 — TodoStore — makeAutoObservable + observer components">
      <Info>
        Full CRUD with filter and computed counts. No reducer, no action types, no selectors. Direct mutation via methods auto-wrapped as actions.
      </Info>
      <TodoList />
      <Pre>{`class TodoStore {
  todos: Todo[] = []
  filter: 'all' | 'done' | 'active' = 'all'
  constructor() { makeAutoObservable(this) }

  addTodo(text: string) { this.todos.push({ id: ..., text, done: false }) }
  toggleTodo(id: number) { this.todos.find(t => t.id === id)!.done ^= 1 }

  get filtered() { return this.todos.filter(...) }
  get doneCount() { return this.todos.filter(t => t.done).length }
}
// No action type strings. No reducers. No selectors. ~25 lines.`}</Pre>
    </Section>
  )
}

// ─── 6.2 RootStore composition — cross-store access ──────────────────────────

class UserStore {
  currentUser: { name: string; isPremium: boolean } | null = null
  constructor(private root: RootStore) { makeAutoObservable(this) }
  login(name: string) { this.currentUser = { name, isPremium: false } }
  togglePremium() { if (this.currentUser) this.currentUser.isPremium = !this.currentUser.isPremium }
  logout() { this.currentUser = null }
}

class CartStore {
  items: { name: string; price: number }[] = []
  constructor(private root: RootStore) { makeAutoObservable(this) }
  addItem(name: string, price: number) { this.items.push({ name, price }) }
  clear() { this.items = [] }
  get subtotal() { return this.items.reduce((s, i) => s + i.price, 0) }
  get discount() { return this.root.user.currentUser?.isPremium ? 0.1 : 0 }
  get total() { return this.subtotal * (1 - this.discount) }
}

class RootStore {
  user: UserStore
  cart: CartStore
  constructor() {
    this.user = new UserStore(this)
    this.cart = new CartStore(this)
  }
}

const rootStore = new RootStore()

const CartView = observer(function CartView() {
  const { user, cart } = rootStore
  return (
    <div>
      <Row style={{ marginBottom: 8 }}>
        {user.currentUser
          ? <>
            <span style={{ color: '#e0e0e0', fontSize: 13 }}>Logged in as {user.currentUser.name}</span>
            <Btn onClick={() => user.togglePremium()}>Toggle premium ({user.currentUser.isPremium ? 'ON' : 'off'})</Btn>
            <Btn onClick={() => user.logout()} danger>Logout</Btn>
          </>
          : <Btn onClick={() => user.login('Alice')}>Login as Alice</Btn>
        }
      </Row>
      <Row style={{ marginBottom: 8 }}>
        <Btn onClick={() => cart.addItem('Widget', 10)}>Add Widget $10</Btn>
        <Btn onClick={() => cart.addItem('Gadget', 25)}>Add Gadget $25</Btn>
        <Btn onClick={() => cart.clear()} danger>Clear cart</Btn>
      </Row>
      {cart.items.map((item, i) => (
        <div key={i} style={{ color: '#888', fontSize: 12 }}>{item.name}: ${item.price}</div>
      ))}
      <div style={{ color: '#e0e0e0', fontSize: 13, marginTop: 8 }}>
        Subtotal: ${cart.subtotal.toFixed(2)} |
        Discount: {(cart.discount * 100).toFixed(0)}% |
        <span style={{ color: '#4a9eff' }}> Total: ${cart.total.toFixed(2)}</span>
      </div>
    </div>
  )
})

function RootStoreSection() {
  return (
    <Section title="6.2 — RootStore composition — cross-store references via root">
      <Info>
        Each store receives <code>root</code> in its constructor. <code>CartStore.discount</code> reads <code>root.user.currentUser?.isPremium</code> — toggle premium and total updates immediately.
      </Info>
      <CartView />
      <Pre>{`class CartStore {
  constructor(private root: RootStore) { makeAutoObservable(this) }

  get discount() {
    return this.root.user.currentUser?.isPremium ? 0.1 : 0
  }
  get total() { return this.subtotal * (1 - this.discount) }
}
class RootStore {
  user = new UserStore(this)
  cart = new CartStore(this)  // passes this as root
}`}</Pre>
    </Section>
  )
}

// ─── 6.3 MobX vs Redux — same counter ────────────────────────────────────────

function ComparisonSection() {
  return (
    <Section title="6.3 — MobX vs Redux — same counter feature">
      <Info>
        Same functionality, radically different boilerplate. Redux trades verbosity for an explicit action audit trail. MobX trades auditability for directness.
      </Info>
      <Row style={{ alignItems: 'flex-start', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#4a9eff', fontSize: 11, marginBottom: 4 }}>MOBX (~10 lines)</p>
          <Pre>{`class CounterStore {
  count = 0
  constructor() {
    makeAutoObservable(this)
  }
  increment() { this.count++ }
  decrement() { this.count-- }
}

// Component:
const Counter = observer(() => (
  <div>
    {store.count}
    <button onClick={() => store.increment()}>+</button>
  </div>
))`}</Pre>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#ff6b6b', fontSize: 11, marginBottom: 4 }}>REDUX (~40 lines + 3 files)</p>
          <Pre>{`// counterSlice.ts
const counterSlice = createSlice({
  name: 'counter',
  initialState: { count: 0 },
  reducers: {
    increment: s => { s.count++ },
    decrement: s => { s.count-- },
  },
})
export const { increment, decrement } = counterSlice.actions

// store.ts
export const store = configureStore({
  reducer: { counter: counterSlice.reducer }
})

// Component:
const Counter = () => {
  const count = useSelector(s => s.counter.count)
  const dispatch = useDispatch()
  return (
    <div>
      {count}
      <button onClick={() => dispatch(increment())}>+</button>
    </div>
  )
}`}</Pre>
        </div>
      </Row>
      <Info style={{ marginTop: 10 }}>
        MobX wins on LOC and directness. Redux wins on: explicit action log (time-travel debug), enforced unidirectional flow, and team-scale predictability.
      </Info>
    </Section>
  )
}

export default function StoresExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>06 · Class Stores</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        MobX's idiomatic store pattern: class with <code>makeAutoObservable</code>, methods as actions, computed as getters. Compose stores via a RootStore that passes itself as a reference.
      </p>
      <TodoStoreSection />
      <RootStoreSection />
      <ComparisonSection />
    </div>
  )
}
