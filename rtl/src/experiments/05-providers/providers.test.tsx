import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  ThemeProvider,
  ThemedButton,
  ThemeDisplay,
  UserContext,
  UserProfile,
  useTheme,
  renderWithProviders,
  type User,
} from './ProvidersExperiment'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'

// ─── 5.1 wrapper option ───────────────────────────────────────────────────────

describe('wrapper option', () => {
  it('renders component with ThemeProvider via wrapper', () => {
    render(<ThemedButton>Click me</ThemedButton>, {
      wrapper: ({ children }: { children: ReactNode }) => (
        <ThemeProvider initialTheme="dark">{children}</ThemeProvider>
      ),
    })
    const btn = screen.getByTestId('themed-button')
    expect(btn).toHaveAttribute('data-theme', 'dark')
    expect(btn).toHaveTextContent('dark')
  })

  it('wraps JSX directly as an alternative', () => {
    render(
      <ThemeProvider initialTheme="light">
        <ThemedButton>Switch</ThemedButton>
      </ThemeProvider>
    )
    expect(screen.getByTestId('themed-button')).toHaveAttribute('data-theme', 'light')
  })
})

// ─── 5.2 Context interaction ─────────────────────────────────────────────────

describe('context interaction', () => {
  it('toggle changes theme across both consumers', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider initialTheme="dark">
        <ThemedButton>Toggle</ThemedButton>
        <ThemeDisplay />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme-display')).toHaveTextContent('dark')
    await user.click(screen.getByTestId('themed-button'))
    expect(screen.getByTestId('theme-display')).toHaveTextContent('light')
    expect(screen.getByTestId('themed-button')).toHaveAttribute('data-theme', 'light')
  })

  it('toggles back to dark', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider initialTheme="dark">
        <ThemedButton>Toggle</ThemedButton>
        <ThemeDisplay />
      </ThemeProvider>
    )

    await user.click(screen.getByTestId('themed-button'))
    await user.click(screen.getByTestId('themed-button'))
    expect(screen.getByTestId('theme-display')).toHaveTextContent('dark')
  })
})

// ─── 5.3 UserContext — null-safe guard ───────────────────────────────────────

describe('UserContext', () => {
  it('renders user profile when user is provided', () => {
    const user: User = { name: 'Alice', role: 'admin' }
    render(
      <UserContext.Provider value={user}>
        <UserProfile />
      </UserContext.Provider>
    )
    expect(screen.getByTestId('user-name')).toHaveTextContent('Alice')
    expect(screen.getByTestId('user-role')).toHaveTextContent('admin')
    expect(screen.getByRole('button', { name: 'Admin Panel' })).toBeInTheDocument()
  })

  it('hides Admin Panel for viewer role', () => {
    const user: User = { name: 'Bob', role: 'viewer' }
    render(
      <UserContext.Provider value={user}>
        <UserProfile />
      </UserContext.Provider>
    )
    expect(screen.queryByRole('button', { name: 'Admin Panel' })).not.toBeInTheDocument()
  })
})

// ─── 5.4 renderWithProviders utility ────────────────────────────────────────

describe('renderWithProviders helper', () => {
  it('renders ThemedButton through the utility', () => {
    render(renderWithProviders(<ThemedButton>Hi</ThemedButton>, { initialTheme: 'light' }))
    expect(screen.getByTestId('themed-button')).toHaveAttribute('data-theme', 'light')
  })

  it('combines theme + user context in one call', () => {
    const user: User = { name: 'Dana', role: 'admin' }
    render(renderWithProviders(<UserProfile />, { user }))
    expect(screen.getByTestId('user-name')).toHaveTextContent('Dana')
  })
})

// ─── 5.5 useTheme hook with provider wrapper ─────────────────────────────────

describe('useTheme via renderHook + wrapper', () => {
  it('reads theme from context', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeProvider initialTheme="light">{children}</ThemeProvider>
    )
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('light')
  })

  it('toggle changes theme value in hook result', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeProvider initialTheme="dark">{children}</ThemeProvider>
    )
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('dark')
    act(() => { result.current.toggle() })
    expect(result.current.theme).toBe('light')
  })
})
