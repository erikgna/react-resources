import { createContext, useContext, useState, type ReactNode } from 'react'
import { Section, Info, Pre } from '../shared'

// ─── Context definitions ──────────────────────────────────────────────────────

export type Theme = 'dark' | 'light'
export type ThemeContextValue = { theme: Theme; toggle: () => void }

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggle: () => {},
})

export function ThemeProvider({ children, initialTheme = 'dark' }: { children: ReactNode; initialTheme?: Theme }) {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  return (
    <ThemeContext.Provider value={{ theme, toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark') }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

// ─── Components that consume context ─────────────────────────────────────────

export function ThemedButton({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      data-testid="themed-button"
      data-theme={theme}
      style={{ background: theme === 'dark' ? '#222' : '#eee', color: theme === 'dark' ? '#fff' : '#000' }}
    >
      {children} [{theme}]
    </button>
  )
}

export function ThemeDisplay() {
  const { theme } = useTheme()
  return <span data-testid="theme-display">{theme}</span>
}

// ─── User context ─────────────────────────────────────────────────────────────

export type User = { name: string; role: 'admin' | 'viewer' }
export const UserContext = createContext<User | null>(null)

export function useUser() {
  const user = useContext(UserContext)
  if (!user) throw new Error('useUser must be used within UserContext.Provider')
  return user
}

export function UserProfile() {
  const user = useUser()
  return (
    <div>
      <p data-testid="user-name">{user.name}</p>
      <p data-testid="user-role">{user.role}</p>
      {user.role === 'admin' && <button>Admin Panel</button>}
    </div>
  )
}

// ─── Custom render utility (common pattern) ───────────────────────────────────

export function renderWithProviders(
  ui: ReactNode,
  { initialTheme = 'dark' as Theme, user = null as User | null } = {}
) {
  return (
    <ThemeProvider initialTheme={initialTheme}>
      <UserContext.Provider value={user}>
        {ui}
      </UserContext.Provider>
    </ThemeProvider>
  )
}

// ─── 5.1 wrapper option ───────────────────────────────────────────────────────

function WrapperSection() {
  return (
    <Section title="5.1 — wrapper option in render()">
      <Info>Pass providers as a wrapper to render() — cleanest way for single-provider tests.</Info>
      <Pre>{`import { render, screen } from '@testing-library/react'

// Option A: wrapper prop
render(<ThemedButton>Click</ThemedButton>, {
  wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
})

// Option B: wrap the JSX directly (equivalent, more explicit)
render(
  <ThemeProvider initialTheme="light">
    <ThemedButton>Click</ThemedButton>
  </ThemeProvider>
)

// wrapper is preferred when your custom renderWithProviders
// utility wraps multiple providers — keeps test code clean.`}</Pre>
    </Section>
  )
}

// ─── 5.2 Custom render helper ─────────────────────────────────────────────────

function CustomRenderSection() {
  return (
    <Section title="5.2 — renderWithProviders utility">
      <Info>In real apps, create a shared renderWithProviders helper that wraps all global providers. Import it instead of RTL's render.</Info>
      <Pre>{`// test-utils.tsx — shared across all tests
import { render } from '@testing-library/react'
import { ThemeProvider } from './ThemeContext'
import { UserContext } from './UserContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function AllProviders({ children, options }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <ThemeProvider initialTheme={options.theme}>
        <UserContext.Provider value={options.user}>
          {children}
        </UserContext.Provider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export function renderWithProviders(ui, options = {}) {
  return render(ui, {
    wrapper: (props) => <AllProviders {...props} options={options} />,
  })
}

// Usage in test:
renderWithProviders(<UserProfile />, { user: { name: 'Alice', role: 'admin' } })`}</Pre>
    </Section>
  )
}

// ─── 5.3 Context live demos ───────────────────────────────────────────────────

function LiveDemoSection() {
  return (
    <Section title="5.3 — Live context demos">
      <Info>ThemeProvider wraps both components — they share the same context. Clicking the button toggles both.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14 }}>
        <ThemeProvider>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <ThemedButton>Toggle Theme</ThemedButton>
            <ThemeDisplay />
          </div>
        </ThemeProvider>
      </div>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ProvidersExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>05 · Providers</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Most real components need Context, Router, or other providers. RTL's wrapper option
        and a shared renderWithProviders utility handle this without cluttering test files.
      </p>
      <WrapperSection />
      <CustomRenderSection />
      <LiveDemoSection />
    </div>
  )
}
