import { renderHook, act, waitFor } from '@testing-library/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useCounter, useToggle, useLocalStorage, useFetch, CounterDemo, ToggleDemo } from './HooksExperiment'

// ─── 4.1 useCounter ───────────────────────────────────────────────────────────

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter())
    expect(result.current.count).toBe(0)
  })

  it('initializes with provided value', () => {
    const { result } = renderHook(() => useCounter(10))
    expect(result.current.count).toBe(10)
  })

  it('increments', () => {
    const { result } = renderHook(() => useCounter(0))
    act(() => { result.current.increment() })
    expect(result.current.count).toBe(1)
  })

  it('decrements', () => {
    const { result } = renderHook(() => useCounter(5))
    act(() => { result.current.decrement() })
    expect(result.current.count).toBe(4)
  })

  it('resets to initial value', () => {
    const { result } = renderHook(() => useCounter(3))
    act(() => {
      result.current.increment()
      result.current.increment()
    })
    expect(result.current.count).toBe(5)

    act(() => { result.current.reset() })
    expect(result.current.count).toBe(3)
  })
})

// ─── 4.2 useToggle ────────────────────────────────────────────────────────────

describe('useToggle', () => {
  it('starts off by default', () => {
    const { result } = renderHook(() => useToggle())
    expect(result.current.on).toBe(false)
  })

  it('starts with provided initial state', () => {
    const { result } = renderHook(() => useToggle(true))
    expect(result.current.on).toBe(true)
  })

  it('toggles between on and off', () => {
    const { result } = renderHook(() => useToggle())
    act(() => { result.current.toggle() })
    expect(result.current.on).toBe(true)
    act(() => { result.current.toggle() })
    expect(result.current.on).toBe(false)
  })

  it('setOn forces true regardless of current state', () => {
    const { result } = renderHook(() => useToggle(false))
    act(() => { result.current.setOn() })
    expect(result.current.on).toBe(true)
    act(() => { result.current.setOn() }) // idempotent
    expect(result.current.on).toBe(true)
  })

  it('setOff forces false regardless of current state', () => {
    const { result } = renderHook(() => useToggle(true))
    act(() => { result.current.setOff() })
    expect(result.current.on).toBe(false)
  })
})

// ─── 4.3 useLocalStorage ──────────────────────────────────────────────────────

describe('useLocalStorage', () => {
  beforeEach(() => localStorage.clear())

  it('returns defaultValue when key is not in localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))
    expect(result.current.value).toBe('default')
  })

  it('reads existing value from localStorage', () => {
    localStorage.setItem('theme', JSON.stringify('dark'))
    const { result } = renderHook(() => useLocalStorage('theme', 'light'))
    expect(result.current.value).toBe('dark')
  })

  it('writes to localStorage when set() is called', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0))
    act(() => { result.current.set(42) })
    expect(result.current.value).toBe(42)
    expect(localStorage.getItem('count')).toBe('42')
  })

  it('removes from localStorage on remove()', () => {
    localStorage.setItem('user', JSON.stringify({ name: 'Alice' }))
    const { result } = renderHook(() => useLocalStorage('user', null))
    act(() => { result.current.remove() })
    expect(result.current.value).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('handles JSON parse failure gracefully', () => {
    localStorage.setItem('broken', 'not-valid-json{{{')
    const { result } = renderHook(() => useLocalStorage('broken', 'fallback'))
    expect(result.current.value).toBe('fallback')
  })
})

// ─── 4.4 useFetch — async hook ────────────────────────────────────────────────

describe('useFetch', () => {
  it('starts idle when fetcher is null', () => {
    const { result } = renderHook(() => useFetch<string>(null))
    expect(result.current.status).toBe('idle')
  })

  it('transitions loading → success', async () => {
    const fetcher = () => Promise.resolve('payload')
    const { result } = renderHook(() => useFetch(fetcher))

    expect(result.current.status).toBe('loading')

    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })
    expect((result.current as { status: 'success'; data: string }).data).toBe('payload')
  })

  it('transitions loading → error on rejection', async () => {
    const fetcher = () => Promise.reject(new Error('Fetch failed'))
    const { result } = renderHook(() => useFetch(fetcher))

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect((result.current as { status: 'error'; error: string }).error).toBe('Fetch failed')
  })
})

// ─── 4.5 renderHook with rerender ────────────────────────────────────────────

describe('renderHook rerender with new props', () => {
  it('re-initializes counter when initial prop changes', () => {
    const { result, rerender } = renderHook(
      ({ initial }: { initial: number }) => useCounter(initial),
      { initialProps: { initial: 0 } }
    )
    expect(result.current.count).toBe(0)

    // Increment first
    act(() => { result.current.increment() })
    expect(result.current.count).toBe(1)

    // Note: changing initial via rerender does NOT reset count —
    // useState only uses initial value on first render.
    rerender({ initial: 100 })
    expect(result.current.count).toBe(1)  // stays at 1, not reset to 100
  })
})

// ─── 4.6 Hook via component render ───────────────────────────────────────────

describe('hooks tested through component render', () => {
  it('CounterDemo renders hook state correctly', async () => {
    const user = userEvent.setup()
    render(<CounterDemo />)

    expect(screen.getByTestId('counter-value')).toHaveTextContent('0')
    await user.click(screen.getByRole('button', { name: 'increment' }))
    await user.click(screen.getByRole('button', { name: 'increment' }))
    expect(screen.getByTestId('counter-value')).toHaveTextContent('2')
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByTestId('counter-value')).toHaveTextContent('0')
  })

  it('ToggleDemo renders hook state correctly', async () => {
    const user = userEvent.setup()
    render(<ToggleDemo />)

    expect(screen.getByTestId('toggle-state')).toHaveTextContent('OFF')
    await user.click(screen.getByRole('button', { name: 'Toggle' }))
    expect(screen.getByTestId('toggle-state')).toHaveTextContent('ON')
    await user.click(screen.getByRole('button', { name: 'Force Off' }))
    expect(screen.getByTestId('toggle-state')).toHaveTextContent('OFF')
  })
})
