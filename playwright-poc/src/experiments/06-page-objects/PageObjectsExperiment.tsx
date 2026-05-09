import { useState } from 'react'
import { Section, Info, Pre } from '../shared'

// ─── Components under test ────────────────────────────────────────────────────

export function LoginForm({ onLogin }: { onLogin?: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('All fields required'); return }
    if (password.length < 8) { setError('Password must be 8+ characters'); return }
    setDone(true)
    onLogin?.(email)
  }

  if (done) return <div><div data-testid="welcome">Welcome, {email}!</div></div>

  return (
    <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 280 }}>
      <div>
        <label htmlFor="email" style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>Email</label>
        <input id="email" type="text" value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: '5px 8px', background: '#111', border: '1px solid #333', color: '#e0e0e0', borderRadius: 3 }} />
      </div>
      <div>
        <label htmlFor="password" style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>Password</label>
        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: '5px 8px', background: '#111', border: '1px solid #333', color: '#e0e0e0', borderRadius: 3 }} />
      </div>
      {error && <p role="alert" style={{ color: '#ff6b6b', fontSize: 12 }}>{error}</p>}
      <button type="submit"
        style={{ padding: '6px 14px', background: '#4a9eff22', border: '1px solid #4a9eff55', color: '#4a9eff', borderRadius: 3, fontSize: 13 }}>
        Log in
      </button>
    </form>
  )
}

export interface Todo { id: number; text: string; done: boolean }

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: 'Learn Playwright CT', done: false },
    { id: 2, text: 'Write deep POC', done: false },
  ])
  const [input, setInput] = useState('')
  let nextId = todos.length + 1

  const add = () => {
    if (!input.trim()) return
    setTodos(t => [...t, { id: nextId++, text: input.trim(), done: false }])
    setInput('')
  }
  const toggle = (id: number) =>
    setTodos(t => t.map(todo => todo.id === id ? { ...todo, done: !todo.done } : todo))
  const remove = (id: number) =>
    setTodos(t => t.filter(todo => todo.id !== id))

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <input
          aria-label="New todo"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Add a todo..."
          style={{ flex: 1, padding: '4px 8px', background: '#111', border: '1px solid #333', color: '#e0e0e0', borderRadius: 3 }}
        />
        <button onClick={add}
          style={{ padding: '4px 10px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#c0c0c0', borderRadius: 3, fontSize: 12 }}>
          Add
        </button>
      </div>
      <ul style={{ listStyle: 'none' }}>
        {todos.map(todo => (
          <li key={todo.id} data-testid={`todo-${todo.id}`}
            style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1a1a1a' }}>
            <input type="checkbox" checked={todo.done} onChange={() => toggle(todo.id)} aria-label={`Complete: ${todo.text}`} />
            <span style={{ flex: 1, textDecoration: todo.done ? 'line-through' : 'none', color: todo.done ? '#555' : '#e0e0e0', fontSize: 13 }}>
              {todo.text}
            </span>
            <button onClick={() => remove(todo.id)} aria-label={`Delete: ${todo.text}`}
              style={{ padding: '2px 8px', background: 'transparent', border: '1px solid #333', color: '#555', borderRadius: 3, fontSize: 11 }}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <div data-testid="todo-count" style={{ marginTop: 8, fontSize: 11, color: '#555' }}>
        {todos.filter(t => !t.done).length} remaining
      </div>
    </div>
  )
}

// ─── 6.1 Page Object pattern ─────────────────────────────────────────────────

function POPSection() {
  return (
    <Section title="6.1 — Page Object Model with Playwright CT">
      <Info>
        POM wraps component interactions in a typed class.
        Locators live in the class, not scattered across test bodies.
      </Info>
      <div style={{ marginBottom: 10 }}>
        <LoginForm />
      </div>
      <Pre>{`import type { Locator } from '@playwright/experimental-ct-react'

class LoginFormPOM {
  constructor(private root: Locator) {}

  // Locators as getters — lazy, always fresh
  get email()    { return this.root.getByLabel('Email') }
  get password() { return this.root.getByLabel('Password') }
  get submit()   { return this.root.getByRole('button', { name: 'Log in' }) }
  get error()    { return this.root.getByRole('alert') }
  get welcome()  { return this.root.getByTestId('welcome') }

  // High-level actions
  async login(email: string, password: string) {
    await this.email.fill(email)
    await this.password.fill(password)
    await this.submit.click()
  }
}

// Usage in test:
const form = new LoginFormPOM(await mount(<LoginForm />))
await form.login('user@example.com', 'securepass')
await expect(form.welcome).toBeVisible()`}</Pre>
    </Section>
  )
}

// ─── 6.2 Fixtures extension ──────────────────────────────────────────────────

function FixturesSection() {
  return (
    <Section title="6.2 — test.extend() for reusable fixtures">
      <Info>Playwright fixtures replace beforeEach + shared state. They compose and type-check.</Info>
      <Pre>{`import { test as base, expect } from '@playwright/experimental-ct-react'
import type { Locator } from '@playwright/experimental-ct-react'

// Define fixture types
type Fixtures = { loginForm: LoginFormPOM; todoList: TodoListPOM }

const test = base.extend<Fixtures>({
  loginForm: async ({ mount }, use) => {
    const component = await mount(<LoginForm />)
    await use(new LoginFormPOM(component))
  },
  todoList: async ({ mount }, use) => {
    const component = await mount(<TodoList />)
    await use(new TodoListPOM(component))
  },
})

// Tests now receive typed fixtures:
test('login success', async ({ loginForm }) => {
  await loginForm.login('user@example.com', 'securepass')
  await expect(loginForm.welcome).toBeVisible()
})

test('add todo', async ({ todoList }) => {
  await todoList.add('New item')
  await expect(todoList.items).toHaveCount(3)
})`}</Pre>
    </Section>
  )
}

// ─── 6.3 hooksConfig ─────────────────────────────────────────────────────────

function HooksConfigSection() {
  return (
    <Section title="6.3 — hooksConfig for provider injection">
      <Info>hooksConfig passes data from test to the beforeMount hook in playwright/index.tsx — use for themes, auth context, feature flags.</Info>
      <Pre>{`// playwright/index.tsx:
import { beforeMount } from '@playwright/experimental-ct-react/hooks'
import type { AppConfig } from '../src/types'

beforeMount<AppConfig>(async ({ App, hooksConfig }) => {
  const theme = hooksConfig?.theme ?? 'dark'
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider token={hooksConfig?.authToken}>
        <App />
      </AuthProvider>
    </ThemeProvider>
  )
})

// In test:
const component = await mount(<Dashboard />, {
  hooksConfig: { theme: 'light', authToken: 'mock-jwt' },
})`}</Pre>
    </Section>
  )
}

export default function PageObjectsExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>06 · Page Objects</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Page Object Model (POM) encapsulates locators and interactions in typed classes.
        Playwright fixtures (<code>test.extend()</code>) replace shared state and <code>beforeEach</code>,
        providing dependency injection for test setup.
      </p>
      <POPSection />
      <FixturesSection />
      <HooksConfigSection />
    </div>
  )
}
