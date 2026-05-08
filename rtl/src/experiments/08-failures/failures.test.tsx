import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  ActWarningComponent,
  StaleQueryComponent,
  AsyncFalsePositive,
  ImplementationDetailTrap,
  DoubleRenderTrap,
} from './FailuresExperiment'

// ─── 8.1 act() warning — fixed pattern ───────────────────────────────────────

describe('act() warning', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('BROKEN — checks state before async update fires (demonstrates false green)', () => {
    render(<ActWarningComponent />)
    // At this exact point, setTimeout hasn't fired — count is still 0
    // Test "passes" but it's checking stale state
    expect(screen.getByTestId('count')).toHaveTextContent('0')
  })

  it('FIXED — wraps timer advance in act() to flush the update', () => {
    render(<ActWarningComponent />)
    expect(screen.getByTestId('count')).toHaveTextContent('0')

    // act() flushes all synchronous and setTimeout(fn, 0) effects
    act(() => { vi.runAllTimers() })
    expect(screen.getByTestId('count')).toHaveTextContent('1')
  })
})

// ─── 8.2 Stale query reference ────────────────────────────────────────────────

describe('stale query reference', () => {
  it('CORRECT — re-query after DOM mutation', async () => {
    const user = userEvent.setup()
    render(<StaleQueryComponent />)

    expect(screen.getByTestId('target')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'hide' }))

    // Don't use the cached reference — query again
    expect(screen.queryByTestId('target')).not.toBeInTheDocument()
  })

  it('demonstrates not-in-document check on detached node works correctly', async () => {
    const user = userEvent.setup()
    render(<StaleQueryComponent />)

    // Cache the node before removal
    const target = screen.getByTestId('target')
    expect(target).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'hide' }))

    // jest-dom's toBeInTheDocument checks document.contains(element)
    // After removal, this correctly reports not-in-document
    expect(target).not.toBeInTheDocument()
  })
})

// ─── 8.3 Behavioral over implementation details ──────────────────────────────

describe('testing behavior, not implementation details', () => {
  it('CORRECT — tests what user observes, not internal state', async () => {
    const user = userEvent.setup()
    render(<ImplementationDetailTrap />)

    // Don't access component state directly — observe DOM output
    expect(screen.getByTestId('display')).toHaveTextContent('0')

    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByTestId('display')).toHaveTextContent('1')

    await user.click(screen.getByRole('button', { name: 'Add' }))
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByTestId('display')).toHaveTextContent('3')
  })
})

// ─── 8.4 Async false positives ───────────────────────────────────────────────

describe('async false positives', () => {
  it('BROKEN — asserts absence before async op runs (false positive demo)', async () => {
    let resolveIt!: (v: string) => void
    const fetcher = () => new Promise<string>(r => { resolveIt = r })
    render(<AsyncFalsePositive fetcher={fetcher} />)

    // Fetch hasn't resolved — result doesn't exist YET
    // This passes, but for the wrong reason
    expect(screen.queryByTestId('result')).not.toBeInTheDocument()

    // Now resolve it — result appears
    act(() => { resolveIt('surprise') })
    await screen.findByTestId('result')
    expect(screen.getByTestId('result')).toHaveTextContent('surprise')
  })

  it('FIXED — wait for load to complete, THEN assert absence of error', async () => {
    const fetcher = () => Promise.resolve('loaded data')
    render(<AsyncFalsePositive fetcher={fetcher} />)

    // First verify the happy path actually loaded
    await screen.findByTestId('result')
    expect(screen.getByTestId('result')).toHaveTextContent('loaded data')

    // Now the absence check is meaningful — the component has finished loading
    expect(screen.queryByTestId('error-state')).not.toBeInTheDocument()
  })
})

// ─── 8.5 cleanup isolation ────────────────────────────────────────────────────

describe('cleanup isolation — each test gets a clean DOM', () => {
  it('first test: renders one button', () => {
    render(<button>Isolated</button>)
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('second test: still sees only one button (cleanup worked)', () => {
    render(<button>Isolated</button>)
    // If afterEach cleanup didn't run, this would find 2 buttons
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('third test: confirms DOM is always fresh', () => {
    render(<button>Isolated</button>)
    render(<button>Also Isolated</button>)  // second render in same test
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })
})

// ─── 8.6 waitFor misuse ───────────────────────────────────────────────────────

describe('waitFor misuse patterns', () => {
  it('WRONG — wrapping non-async code in waitFor adds overhead with no benefit', async () => {
    render(<DoubleRenderTrap />)
    // This works but waitFor is unnecessary — the assertion is synchronous
    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('0')
    })
  })

  it('CORRECT — use waitFor only when state might not be settled', async () => {
    const user = userEvent.setup()
    render(<DoubleRenderTrap />)

    await user.click(screen.getByRole('button', { name: 'Add Item' }))
    await user.click(screen.getByRole('button', { name: 'Add Item' }))

    // After userEvent, DOM is settled — no waitFor needed
    expect(screen.getByTestId('count')).toHaveTextContent('2')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('WRONG — putting multiple getBy calls inside waitFor silences legitimate failures', async () => {
    const user = userEvent.setup()
    render(<DoubleRenderTrap />)

    await user.click(screen.getByRole('button', { name: 'Add Item' }))

    // waitFor retries the whole callback — if getByTestId throws first,
    // the later assertion is never reached, hiding potential bugs
    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('1')
      expect(screen.getAllByRole('listitem')).toHaveLength(1)
    })
    // PREFERRED: assert synchronously after the event
    expect(screen.getByTestId('count')).toHaveTextContent('1')
  })
})
