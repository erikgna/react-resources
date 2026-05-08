import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataLoader, AutoLoader, NotificationToast, DebounceSearch } from './AsyncExperiment'

// ─── 3.1 findBy* — async element appears ─────────────────────────────────────

describe('findBy* — waits for element to appear', () => {
  it('finds result after async fetch resolves', async () => {
    const fetcher = () => new Promise<string>(resolve => setTimeout(() => resolve('Server data'), 50))
    render(<DataLoader fetcher={fetcher} />)

    await userEvent.click(screen.getByRole('button', { name: 'Load Data' }))

    // findBy retries until timeout — handles the async state transition
    const result = await screen.findByTestId('result')
    expect(result).toHaveTextContent('Server data')
  })

  it('shows loading state during fetch', async () => {
    let resolve!: (v: string) => void
    const fetcher = () => new Promise<string>(r => { resolve = r })
    render(<DataLoader fetcher={fetcher} />)

    await userEvent.click(screen.getByRole('button', { name: 'Load Data' }))

    // Loading indicator is synchronously visible after click
    // Button text changes to "Loading..." when disabled — query by new label
    expect(screen.getByRole('status', { name: 'loading' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Loading...' })).toBeDisabled()

    // Resolve the promise and wait for UI to update
    act(() => { resolve('done') })
    await screen.findByTestId('result')
    expect(screen.queryByRole('status', { name: 'loading' })).not.toBeInTheDocument()
  })

  it('shows error state when fetch rejects', async () => {
    const fetcher = () => Promise.reject(new Error('Network timeout'))
    render(<DataLoader fetcher={fetcher} />)

    await userEvent.click(screen.getByRole('button', { name: 'Load Data' }))

    const error = await screen.findByRole('alert')
    expect(error).toHaveTextContent('Network timeout')
  })
})

// ─── 3.2 AutoLoader — useEffect async ────────────────────────────────────────

describe('AutoLoader — async useEffect on mount', () => {
  it('shows loading then renders list', async () => {
    const fetcher = () => Promise.resolve(['Apple', 'Banana', 'Cherry'])
    render(<AutoLoader fetcher={fetcher} />)

    // findBy waits for the list to appear after the effect resolves
    await screen.findByRole('list')

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('Apple')
  })
})

// ─── 3.3 waitFor — multi-assertion waits ─────────────────────────────────────

describe('waitFor — multiple conditions', () => {
  it('waits until loading disappears AND result appears', async () => {
    const fetcher = () => new Promise<string>(resolve => setTimeout(() => resolve('Result'), 50))
    render(<DataLoader fetcher={fetcher} />)

    await userEvent.click(screen.getByRole('button', { name: 'Load Data' }))

    await waitFor(() => {
      expect(screen.queryByRole('status', { name: 'loading' })).not.toBeInTheDocument()
      expect(screen.getByTestId('result')).toBeInTheDocument()
    })
  })
})

// ─── 3.4 Fake timers — toast disappears ──────────────────────────────────────

describe('fake timers — NotificationToast', () => {
  // userEvent.setup() uses internal Promises that deadlock under vi.useFakeTimers().
  // Use fireEvent for the click that triggers the timer — fireEvent is purely synchronous.
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('shows toast on click', () => {
    render(<NotificationToast duration={300} />)
    fireEvent.click(screen.getByRole('button', { name: 'Show Toast' }))
    expect(screen.getByTestId('toast')).toBeInTheDocument()
  })

  it('hides toast after duration using fake timer', () => {
    render(<NotificationToast duration={300} />)
    fireEvent.click(screen.getByRole('button', { name: 'Show Toast' }))
    expect(screen.getByTestId('toast')).toBeInTheDocument()

    // Advance the fake clock — act() flushes the resulting state update
    act(() => { vi.advanceTimersByTime(300) })
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument()
  })

  it('toast still visible before duration elapses', () => {
    render(<NotificationToast duration={300} />)
    fireEvent.click(screen.getByRole('button', { name: 'Show Toast' }))
    act(() => { vi.advanceTimersByTime(100) })  // only partial advance
    expect(screen.getByTestId('toast')).toBeInTheDocument()
  })
})

// ─── 3.5 Fake timers — debounce ──────────────────────────────────────────────

describe('fake timers — DebounceSearch', () => {
  // fireEvent.change is used instead of userEvent.type to avoid the
  // userEvent + fake timer deadlock. fireEvent is synchronous and has no
  // internal timer dependencies.
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('does not show result before debounce delay', () => {
    render(<DebounceSearch delay={300} />)
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'react' } })
    // Not yet — debounce hasn't fired
    expect(screen.queryByTestId('debounced-result')).not.toBeInTheDocument()
  })

  it('shows debounced result after delay', () => {
    render(<DebounceSearch delay={300} />)
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'react' } })
    act(() => { vi.advanceTimersByTime(300) })
    expect(screen.getByTestId('debounced-result')).toHaveTextContent('react')
  })

  it('only fires once for rapid typing (debounce resets)', () => {
    render(<DebounceSearch delay={300} />)
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 're' } })
    act(() => { vi.advanceTimersByTime(100) })   // partial advance, no fire
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'react' } })
    act(() => { vi.advanceTimersByTime(300) })   // full advance after last key
    expect(screen.getByTestId('debounced-result')).toHaveTextContent('react')
  })
})

// ─── 3.6 findBy timeout configuration ────────────────────────────────────────

describe('findBy* timeout options', () => {
  it('fails with short timeout if element takes longer', async () => {
    const fetcher = () => new Promise<string>(resolve => setTimeout(() => resolve('slow'), 200))
    render(<DataLoader fetcher={fetcher} />)

    await userEvent.click(screen.getByRole('button', { name: 'Load Data' }))

    // findByTestId with 50ms timeout should fail because fetch takes 200ms
    await expect(
      screen.findByTestId('result', {}, { timeout: 50 })
    ).rejects.toThrow()
  })
})
