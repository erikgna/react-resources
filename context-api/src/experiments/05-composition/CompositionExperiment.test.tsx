import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createContext, useContext, useRef, useState, memo, useMemo } from 'react'

// ─── Contexts ─────────────────────────────────────────────────────────────────

type Theme = 'dark' | 'light' | 'solarized'
type User  = { name: string; role: 'admin' | 'viewer' | 'guest' }
type Locale = 'en' | 'pt' | 'ja'

const ThemeCtx  = createContext<Theme>('dark')
const AuthCtx   = createContext<User>({ name: 'guest', role: 'guest' })
const LocaleCtx = createContext<Locale>('en')

function useRenderCount() {
  const ref = useRef(0)
  ref.current++
  return ref.current
}

// memo required: blocks parent-triggered re-renders so only context-triggered
// re-renders are counted. Without memo, Parent re-render cascades to all children.
const ThemeDisplay = memo(function ThemeDisplay({ id }: { id: string }) {
  const theme = useContext(ThemeCtx)
  const renders = useRenderCount()
  return <div data-testid={id} data-renders={renders}>{theme}</div>
})

const AuthDisplay = memo(function AuthDisplay({ id }: { id: string }) {
  const user = useContext(AuthCtx)
  const renders = useRenderCount()
  return <div data-testid={id} data-renders={renders}>{user.name}:{user.role}</div>
})

const LocaleDisplay = memo(function LocaleDisplay({ id }: { id: string }) {
  const locale = useContext(LocaleCtx)
  const renders = useRenderCount()
  return <div data-testid={id} data-renders={renders}>{locale}</div>
})

function MultiConsumer({ id }: { id: string }) {
  const theme  = useContext(ThemeCtx)
  const user   = useContext(AuthCtx)
  const locale = useContext(LocaleCtx)
  const renders = useRenderCount()
  return <div data-testid={id} data-renders={renders}>{theme}|{user.name}|{locale}</div>
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('05 · Composition — independent multi-context', () => {
  it('each context propagates its own value independently', () => {
    render(
      <ThemeCtx.Provider value="solarized">
        <AuthCtx.Provider value={{ name: 'alice', role: 'admin' }}>
          <LocaleCtx.Provider value="pt">
            <ThemeDisplay id="theme" />
            <AuthDisplay id="auth" />
            <LocaleDisplay id="locale" />
          </LocaleCtx.Provider>
        </AuthCtx.Provider>
      </ThemeCtx.Provider>
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('solarized')
    expect(screen.getByTestId('auth')).toHaveTextContent('alice:admin')
    expect(screen.getByTestId('locale')).toHaveTextContent('pt')
  })

  it('changing theme does NOT re-render auth or locale consumers', () => {
    function Parent() {
      const [theme, setTheme] = useState<Theme>('dark')
      // Stable ref: useMemo prevents new object on theme change
      const authVal = useMemo(() => ({ name: 'alice', role: 'admin' as const }), [])
      return (
        <ThemeCtx.Provider value={theme}>
          <AuthCtx.Provider value={authVal}>
            <LocaleCtx.Provider value="en">
              <ThemeDisplay id="theme" />
              <AuthDisplay id="auth" />
              <LocaleDisplay id="locale" />
              <button onClick={() => setTheme('light')}>change-theme</button>
            </LocaleCtx.Provider>
          </AuthCtx.Provider>
        </ThemeCtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('change-theme'))
    expect(screen.getByTestId('theme').getAttribute('data-renders')).toBe('2')
    expect(screen.getByTestId('auth').getAttribute('data-renders')).toBe('1')
    expect(screen.getByTestId('locale').getAttribute('data-renders')).toBe('1')
  })

  it('changing auth does NOT re-render theme or locale consumers', () => {
    function Parent() {
      const [user, setUser] = useState<User>({ name: 'alice', role: 'admin' })
      return (
        <ThemeCtx.Provider value="dark">
          <AuthCtx.Provider value={user}>
            <LocaleCtx.Provider value="en">
              <ThemeDisplay id="theme" />
              <AuthDisplay id="auth" />
              <LocaleDisplay id="locale" />
              <button onClick={() => setUser({ name: 'bob', role: 'viewer' })}>change-user</button>
            </LocaleCtx.Provider>
          </AuthCtx.Provider>
        </ThemeCtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('change-user'))
    expect(screen.getByTestId('theme').getAttribute('data-renders')).toBe('1')
    expect(screen.getByTestId('auth').getAttribute('data-renders')).toBe('2')
    expect(screen.getByTestId('locale').getAttribute('data-renders')).toBe('1')
  })

  it('multi-context consumer re-renders when ANY subscribed context changes', () => {
    function Parent() {
      const [theme, setTheme] = useState<Theme>('dark')
      const [user, setUser] = useState<User>({ name: 'alice', role: 'admin' })
      const [locale, setLocale] = useState<Locale>('en')
      return (
        <ThemeCtx.Provider value={theme}>
          <AuthCtx.Provider value={user}>
            <LocaleCtx.Provider value={locale}>
              <MultiConsumer id="multi" />
              <button onClick={() => setTheme('light')}>t</button>
              <button onClick={() => setUser({ name: 'bob', role: 'viewer' })}>u</button>
              <button onClick={() => setLocale('pt')}>l</button>
            </LocaleCtx.Provider>
          </AuthCtx.Provider>
        </ThemeCtx.Provider>
      )
    }
    render(<Parent />)
    fireEvent.click(screen.getByText('t'))
    fireEvent.click(screen.getByText('u'))
    fireEvent.click(screen.getByText('l'))
    expect(screen.getByTestId('multi').getAttribute('data-renders')).toBe('4')
  })

  it('provider nesting order does not affect independent context values', () => {
    render(
      // Reversed order vs typical convention — still works
      <LocaleCtx.Provider value="ja">
        <AuthCtx.Provider value={{ name: 'carol', role: 'viewer' }}>
          <ThemeCtx.Provider value="light">
            <ThemeDisplay id="theme" />
            <AuthDisplay id="auth" />
            <LocaleDisplay id="locale" />
          </ThemeCtx.Provider>
        </AuthCtx.Provider>
      </LocaleCtx.Provider>
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(screen.getByTestId('auth')).toHaveTextContent('carol:viewer')
    expect(screen.getByTestId('locale')).toHaveTextContent('ja')
  })
})
