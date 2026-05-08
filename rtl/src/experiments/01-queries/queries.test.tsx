import { render, screen, within } from '@testing-library/react'
import { GreetingCard, StatusBadge, UserList } from './QueriesExperiment'

// ─── 1.1 getByRole ────────────────────────────────────────────────────────────

describe('getByRole', () => {
  it('finds heading by role and accessible name', () => {
    render(<GreetingCard name="Alice" role="Admin" />)
    // heading role is implicit on h1-h6 elements
    const heading = screen.getByRole('heading', { name: /welcome, alice/i })
    expect(heading).toBeInTheDocument()
    expect(heading.tagName).toBe('H2')
  })

  it('finds button by aria-label', () => {
    render(<GreetingCard name="Alice" role="Admin" />)
    const btn = screen.getByRole('button', { name: 'Close card' })
    expect(btn).toBeInTheDocument()
  })

  it('finds textbox by associated label (for/id pair)', () => {
    render(<GreetingCard name="Alice" role="Admin" />)
    // label[for="email-input"] + input[id="email-input"] → accessible name is "Email"
    const emailInput = screen.getByRole('textbox', { name: 'Email' })
    expect(emailInput).toBeInTheDocument()
    expect(emailInput).toHaveAttribute('type', 'email')
  })

  it('finds custom role via aria role attribute', () => {
    render(<StatusBadge status="active" />)
    // role="status" is explicit on the span
    const badge = screen.getByRole('status', { name: /status: active/i })
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('active')
  })
})

// ─── 1.2 getByText ────────────────────────────────────────────────────────────

describe('getByText', () => {
  it('matches exact text', () => {
    render(<GreetingCard name="Bob" role="Viewer" />)
    expect(screen.getByText('Welcome, Bob')).toBeInTheDocument()
  })

  it('matches with regex', () => {
    render(<GreetingCard name="Bob" role="Viewer" />)
    expect(screen.getByText(/welcome/i)).toBeInTheDocument()
  })

  it('throws when text not found', () => {
    render(<GreetingCard name="Bob" role="Viewer" />)
    expect(() => screen.getByText('Nonexistent text')).toThrow()
  })
})

// ─── 1.3 queryBy* — absence assertions ───────────────────────────────────────

describe('queryBy* — asserting absence', () => {
  it('returns null when element is absent (does not throw)', () => {
    render(<GreetingCard name="Charlie" role="Guest" />)
    // queryBy returns null instead of throwing — safe for "should not exist" assertions
    expect(screen.queryByText('Delete')).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('contrast: getByText throws on missing element', () => {
    render(<GreetingCard name="Charlie" role="Guest" />)
    expect(() => screen.getByText('Delete')).toThrow(/unable to find/i)
  })
})

// ─── 1.4 getByLabelText ───────────────────────────────────────────────────────

describe('getByLabelText', () => {
  it('finds input associated via label[for] + input[id]', () => {
    render(<GreetingCard name="Dana" role="Editor" />)
    const input = screen.getByLabelText('Email')
    expect(input).toBeInTheDocument()
    expect(input.tagName).toBe('INPUT')
  })
})

// ─── 1.5 getByPlaceholderText ─────────────────────────────────────────────────

describe('getByPlaceholderText', () => {
  it('finds input by placeholder attribute', () => {
    render(<GreetingCard name="Eve" role="Viewer" />)
    const searchInput = screen.getByPlaceholderText('Search...')
    expect(searchInput).toBeInTheDocument()
  })
})

// ─── 1.6 getByAltText ────────────────────────────────────────────────────────

describe('getByAltText', () => {
  it('finds image by alt text', () => {
    render(<GreetingCard name="Frank" role="Admin" />)
    const img = screen.getByAltText('Profile photo')
    expect(img.tagName).toBe('IMG')
  })
})

// ─── 1.7 getByTestId ─────────────────────────────────────────────────────────

describe('getByTestId — last resort', () => {
  it('finds element by data-testid', () => {
    render(<GreetingCard name="Grace" role="Admin" />)
    const label = screen.getByTestId('role-label')
    expect(label).toHaveTextContent('Role: Admin')
  })
})

// ─── 1.8 getAllBy* ────────────────────────────────────────────────────────────

describe('getAllBy* — multiple matches', () => {
  it('returns all matching elements as an array', () => {
    render(<UserList />)
    // Both rows have a button labelled "Edit"
    const editBtns = screen.getAllByRole('button', { name: 'Edit' })
    expect(editBtns).toHaveLength(2)
  })

  it('throws when zero elements found', () => {
    render(<UserList />)
    expect(() => screen.getAllByRole('button', { name: 'Delete' })).toThrow()
  })
})

// ─── 1.9 within() — scoped queries ───────────────────────────────────────────

describe('within() — scoped queries', () => {
  it('disambiguates duplicate elements by scoping to a container', () => {
    render(<UserList />)
    // screen.getByRole('button', { name: 'Edit' }) would throw — 2 matches
    const aliceRow = screen.getByTestId('user-alice')
    const editBtn = within(aliceRow).getByRole('button', { name: 'Edit' })
    expect(editBtn).toBeInTheDocument()

    // Verify Bob's row has its own Edit button
    const bobRow = screen.getByTestId('user-bob')
    expect(within(bobRow).getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })

  it('within() queryBy returns null for elements outside the scope', () => {
    render(<UserList />)
    const aliceRow = screen.getByTestId('user-alice')
    // Bob text is outside alice row
    expect(within(aliceRow).queryByText('Bob')).toBeNull()
  })
})
