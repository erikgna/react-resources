import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm, SurveyForm, type LoginData, type SurveyData } from './FormsExperiment'

// ─── 6.1 Happy path submit ────────────────────────────────────────────────────

describe('LoginForm — happy path', () => {
  it('submits valid credentials', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<(data: LoginData) => void>()
    render(<LoginForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Email'), 'alice@example.com')
    await user.type(screen.getByLabelText('Password'), 'supersecret')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'alice@example.com',
      password: 'supersecret',
    })
    expect(screen.queryAllByRole('alert')).toHaveLength(0)
  })

  it('finds inputs by label — validates label associations', async () => {
    render(<LoginForm onSubmit={vi.fn()} />)
    // If label[for] + input[id] are mismatched, this throws
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
  })
})

// ─── 6.2 Validation errors ────────────────────────────────────────────────────

describe('LoginForm — validation', () => {
  it('shows both error messages when form is submitted empty', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    const alerts = screen.getAllByRole('alert')
    expect(alerts).toHaveLength(2)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows email error for missing @ symbol', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText('Email'), 'notanemail')
    await user.type(screen.getByLabelText('Password'), 'validpassword')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email address')
  })

  it('shows password error for short password', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText('Email'), 'valid@email.com')
    await user.type(screen.getByLabelText('Password'), 'short')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(screen.getByRole('alert')).toHaveTextContent('at least 8 characters')
  })

  it('aria-invalid is set on invalid fields', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true')
  })

  it('clears errors on valid resubmit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} />)

    // First: invalid submit
    await user.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(screen.getAllByRole('alert')).toHaveLength(2)

    // Fix and resubmit
    await user.type(screen.getByLabelText('Email'), 'fixed@example.com')
    await user.type(screen.getByLabelText('Password'), 'fixedpassword')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(screen.queryAllByRole('alert')).toHaveLength(0)
    expect(onSubmit).toHaveBeenCalledOnce()
  })
})

// ─── 6.3 SurveyForm — select, radio, checkbox, textarea ──────────────────────

describe('SurveyForm — select, radio, checkbox, textarea', () => {
  it('submits with default values', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<(data: SurveyData) => void>()
    render(<SurveyForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Submit Survey' }))
    expect(onSubmit).toHaveBeenCalledWith({
      rating: '3',
      subscribe: false,
      tier: 'free',
      feedback: '',
    })
  })

  it('changes select value', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<(data: SurveyData) => void>()
    render(<SurveyForm onSubmit={onSubmit} />)

    await user.selectOptions(screen.getByLabelText('Rating'), '5')
    await user.click(screen.getByRole('button', { name: 'Submit Survey' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ rating: '5' }))
  })

  it('selects radio button', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<(data: SurveyData) => void>()
    render(<SurveyForm onSubmit={onSubmit} />)

    await user.click(screen.getByLabelText('Pro'))
    await user.click(screen.getByRole('button', { name: 'Submit Survey' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ tier: 'pro' }))
  })

  it('toggles newsletter subscription checkbox', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<(data: SurveyData) => void>()
    render(<SurveyForm onSubmit={onSubmit} />)

    await user.click(screen.getByLabelText(/subscribe to newsletter/i))
    await user.click(screen.getByRole('button', { name: 'Submit Survey' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ subscribe: true }))
  })

  it('fills textarea for feedback', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<(data: SurveyData) => void>()
    render(<SurveyForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Feedback'), 'Great product!')
    await user.click(screen.getByRole('button', { name: 'Submit Survey' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ feedback: 'Great product!' }))
  })

  it('full form submission with all fields', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<(data: SurveyData) => void>()
    render(<SurveyForm onSubmit={onSubmit} />)

    await user.selectOptions(screen.getByLabelText('Rating'), '4')
    await user.click(screen.getByLabelText('Pro'))
    await user.click(screen.getByLabelText(/subscribe/i))
    await user.type(screen.getByLabelText('Feedback'), 'Needs dark mode')
    await user.click(screen.getByRole('button', { name: 'Submit Survey' }))

    expect(onSubmit).toHaveBeenCalledWith({
      rating: '4',
      tier: 'pro',
      subscribe: true,
      feedback: 'Needs dark mode',
    })
  })
})
