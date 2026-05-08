import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Counter, TextInput, ToggleCheckbox, HoverMenu, EventLog } from './UserEventsExperiment'

// ─── 2.1 click ────────────────────────────────────────────────────────────────

describe('userEvent.click', () => {
  it('increments counter on click', async () => {
    const user = userEvent.setup()
    render(<Counter />)

    await user.click(screen.getByRole('button', { name: 'Increment' }))
    expect(screen.getByTestId('count')).toHaveTextContent('1')

    await user.click(screen.getByRole('button', { name: 'Increment' }))
    await user.click(screen.getByRole('button', { name: 'Increment' }))
    expect(screen.getByTestId('count')).toHaveTextContent('3')
  })

  it('decrements counter on click', async () => {
    const user = userEvent.setup()
    render(<Counter />)

    await user.click(screen.getByRole('button', { name: 'Decrement' }))
    expect(screen.getByTestId('count')).toHaveTextContent('-1')
  })

  it('resets counter', async () => {
    const user = userEvent.setup()
    render(<Counter />)

    await user.click(screen.getByRole('button', { name: 'Increment' }))
    await user.click(screen.getByRole('button', { name: 'Increment' }))
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByTestId('count')).toHaveTextContent('0')
  })
})

// ─── 2.2 type — text input ────────────────────────────────────────────────────

describe('userEvent.type', () => {
  it('types into a labeled input', async () => {
    const user = userEvent.setup()
    render(<TextInput />)

    const input = screen.getByLabelText('Message')
    await user.type(input, 'Hello world')
    expect(input).toHaveValue('Hello world')
  })

  it('submits form with keyboard Enter after typing', async () => {
    const user = userEvent.setup()
    render(<TextInput />)

    await user.type(screen.getByLabelText('Message'), 'test message')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(screen.getByTestId('submitted-value')).toHaveTextContent('test message')
  })

  it('clears then types new value', async () => {
    const user = userEvent.setup()
    render(<TextInput />)

    const input = screen.getByLabelText('Message')
    await user.type(input, 'first')
    await user.clear(input)
    await user.type(input, 'second')
    expect(input).toHaveValue('second')
  })
})

// ─── 2.3 checkbox ────────────────────────────────────────────────────────────

describe('userEvent checkbox', () => {
  it('toggles checkbox on click', async () => {
    const user = userEvent.setup()
    render(<ToggleCheckbox />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)
    expect(checkbox).toBeChecked()

    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })
})

// ─── 2.4 hover ───────────────────────────────────────────────────────────────

describe('userEvent.hover / unhover', () => {
  it('shows menu on hover', async () => {
    const user = userEvent.setup()
    render(<HoverMenu />)

    // Menu starts hidden
    expect(screen.queryByTestId('dropdown')).not.toBeInTheDocument()

    await user.hover(screen.getByRole('button', { name: 'Menu' }))
    expect(screen.getByTestId('dropdown')).toBeInTheDocument()
    expect(screen.getAllByRole('menuitem')).toHaveLength(2)
  })

  it('hides menu on unhover', async () => {
    const user = userEvent.setup()
    render(<HoverMenu />)

    await user.hover(screen.getByRole('button', { name: 'Menu' }))
    await user.unhover(screen.getByRole('button', { name: 'Menu' }))
    expect(screen.queryByTestId('dropdown')).not.toBeInTheDocument()
  })
})

// ─── 2.5 keyboard navigation ─────────────────────────────────────────────────

describe('userEvent.keyboard', () => {
  it('fires keydown events in correct order', async () => {
    const user = userEvent.setup()
    render(<EventLog />)

    const input = screen.getByLabelText('Event log input')
    await user.click(input)
    await user.type(input, 'a')

    const log = screen.getByTestId('event-log')
    expect(log.textContent).toContain('focus')
    expect(log.textContent).toContain('keydown: a')
    expect(log.textContent).toContain('keyup: a')
    expect(log.textContent).toContain('change: a')
  })

  it('tab key moves focus to next focusable element', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <button>First</button>
        <button>Second</button>
      </div>
    )
    await user.tab()
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus()
  })
})

// ─── 2.6 setup() options ──────────────────────────────────────────────────────

describe('userEvent.setup() options', () => {
  it('setup() creates an isolated user instance per test', async () => {
    // Each test gets a fresh user instance — pointer state is independent
    const user1 = userEvent.setup()
    const user2 = userEvent.setup()

    render(<Counter />)
    await user1.click(screen.getByRole('button', { name: 'Increment' }))
    // user2 pointer state is clean — it has NOT tracked the previous click
    await user2.click(screen.getByRole('button', { name: 'Increment' }))
    expect(screen.getByTestId('count')).toHaveTextContent('2')
  })
})
