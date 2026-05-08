import { useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RenderCounter, ItemList, TabPanel } from './PerformanceExperiment'

// ─── 7.1 Render count assertions ──────────────────────────────────────────────

describe('render count tracking', () => {
  it('RenderCounter starts at 1', () => {
    render(<RenderCounter label="test" />)
    expect(screen.getByTestId('renders-test')).toHaveTextContent('1')
  })

  it('unmemoized child re-renders when parent re-renders', async () => {
    const user = userEvent.setup()
    function Parent() {
      const [n, setN] = useState(0)
      return (
        <div>
          <button onClick={() => setN(x => x + 1)}>Tick</button>
          <span data-testid="parent-count">{n}</span>
          <RenderCounter label="child" />
        </div>
      )
    }
    render(<Parent />)
    expect(screen.getByTestId('renders-child')).toHaveTextContent('1')

    await user.click(screen.getByRole('button', { name: 'Tick' }))
    expect(screen.getByTestId('renders-child')).toHaveTextContent('2')
    expect(screen.getByTestId('parent-count')).toHaveTextContent('1')
  })
})

// ─── 7.2 TabPanel — behavioral assertions ────────────────────────────────────

describe('TabPanel — behavioral, not snapshot', () => {
  it('displays first tab content by default', () => {
    render(<TabPanel tabs={['Overview', 'Details', 'Settings']} />)
    expect(screen.getByTestId('active-panel')).toHaveTextContent('Overview content')
  })

  it('switches to clicked tab', async () => {
    const user = userEvent.setup()
    render(<TabPanel tabs={['Overview', 'Details', 'Settings']} />)

    await user.click(screen.getByRole('tab', { name: 'Details' }))
    expect(screen.getByTestId('active-panel')).toHaveTextContent('Details content')
  })

  it('marks selected tab with aria-selected', async () => {
    const user = userEvent.setup()
    render(<TabPanel tabs={['Overview', 'Details', 'Settings']} />)

    const overviewTab = screen.getByRole('tab', { name: 'Overview' })
    expect(overviewTab).toHaveAttribute('aria-selected', 'true')

    await user.click(screen.getByRole('tab', { name: 'Settings' }))
    expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true')
    expect(overviewTab).toHaveAttribute('aria-selected', 'false')
  })

  it('all tabs are discoverable via role', () => {
    render(<TabPanel tabs={['A', 'B', 'C']} />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(3)
  })
})

// ─── 7.3 ItemList with within() ──────────────────────────────────────────────

describe('ItemList — within() scoping', () => {
  const items = [
    { id: 1, name: 'Alpha', active: true },
    { id: 2, name: 'Beta', active: false },
    { id: 3, name: 'Gamma', active: false },
  ]

  it('renders all items', () => {
    render(<ItemList items={items} onToggle={vi.fn()} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('finds toggle button scoped to specific item row', () => {
    render(<ItemList items={items} onToggle={vi.fn()} />)

    const alphaRow = screen.getByTestId('item-1')
    const betaRow = screen.getByTestId('item-2')

    // Alpha is active → button shows "Deactivate"
    expect(within(alphaRow).getByRole('button')).toHaveTextContent('Deactivate')
    // Beta is inactive → button shows "Activate"
    expect(within(betaRow).getByRole('button')).toHaveTextContent('Activate')
  })

  it('calls onToggle with correct id', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<ItemList items={items} onToggle={onToggle} />)

    await user.click(screen.getByRole('button', { name: 'Toggle Alpha' }))
    expect(onToggle).toHaveBeenCalledWith(1)

    await user.click(screen.getByRole('button', { name: 'Toggle Beta' }))
    expect(onToggle).toHaveBeenCalledWith(2)
  })

  it('within() returns null for elements outside the scope', () => {
    render(<ItemList items={items} onToggle={vi.fn()} />)
    const alphaRow = screen.getByTestId('item-1')
    expect(within(alphaRow).queryByText('Beta')).toBeNull()
    expect(within(alphaRow).queryByText('Gamma')).toBeNull()
  })
})

// ─── 7.4 Test execution timing ────────────────────────────────────────────────

describe('test execution timing', () => {
  it('synchronous render completes quickly', () => {
    const start = performance.now()
    render(<TabPanel tabs={['A', 'B', 'C', 'D', 'E']} />)
    const duration = performance.now() - start
    // jsdom + React 19 render should complete well under 100ms
    expect(duration).toBeLessThan(100)
  })

  it('querying 20 items with getAllByRole is fast', () => {
    const manyItems = Array.from({ length: 20 }, (_, i) => ({
      id: i, name: `Item ${i}`, active: false,
    }))
    render(<ItemList items={manyItems} onToggle={vi.fn()} />)

    const start = performance.now()
    const rows = screen.getAllByRole('listitem')
    const duration = performance.now() - start

    expect(rows).toHaveLength(20)
    expect(duration).toBeLessThan(50)
  })
})
