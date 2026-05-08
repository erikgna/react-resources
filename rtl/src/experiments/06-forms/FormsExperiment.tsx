import { useState } from 'react'
import { Section, Info, Pre } from '../shared'

// ─── Components under test ────────────────────────────────────────────────────

export type LoginData = { email: string; password: string }

export function LoginForm({ onSubmit }: { onSubmit: (data: LoginData) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Partial<LoginData>>({})

  const validate = (): boolean => {
    const next: Partial<LoginData> = {}
    if (!email.includes('@')) next.email = 'Invalid email address'
    if (password.length < 8) next.password = 'Password must be at least 8 characters'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) onSubmit({ email, password })
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Login form" noValidate>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && <span id="email-error" role="alert">{errors.email}</span>}
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && <span id="password-error" role="alert">{errors.password}</span>}
      </div>
      <button type="submit">Sign In</button>
    </form>
  )
}

export type SurveyData = { rating: string; subscribe: boolean; tier: string; feedback: string }

export function SurveyForm({ onSubmit }: { onSubmit: (data: SurveyData) => void }) {
  const [rating, setRating] = useState('3')
  const [subscribe, setSubscribe] = useState(false)
  const [tier, setTier] = useState('free')
  const [feedback, setFeedback] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ rating, subscribe, tier, feedback })
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Survey form">
      <div>
        <label htmlFor="rating">Rating</label>
        <select id="rating" value={rating} onChange={e => setRating(e.target.value)}>
          <option value="1">1 - Poor</option>
          <option value="2">2 - Fair</option>
          <option value="3">3 - Good</option>
          <option value="4">4 - Great</option>
          <option value="5">5 - Excellent</option>
        </select>
      </div>
      <div>
        <fieldset>
          <legend>Tier</legend>
          <label>
            <input type="radio" name="tier" value="free" checked={tier === 'free'} onChange={() => setTier('free')} />
            Free
          </label>
          <label>
            <input type="radio" name="tier" value="pro" checked={tier === 'pro'} onChange={() => setTier('pro')} />
            Pro
          </label>
        </fieldset>
      </div>
      <div>
        <label>
          <input type="checkbox" checked={subscribe} onChange={e => setSubscribe(e.target.checked)} />
          {' '}Subscribe to newsletter
        </label>
      </div>
      <div>
        <label htmlFor="feedback">Feedback</label>
        <textarea
          id="feedback"
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder="Tell us more..."
        />
      </div>
      <button type="submit">Submit Survey</button>
    </form>
  )
}

// ─── 6.1 Accessible form testing ──────────────────────────────────────────────

function AccessibleFormSection() {
  return (
    <Section title="6.1 — Accessibility-first form testing">
      <Info>Test forms the same way users fill them: by label text. This enforces proper label associations in your markup.</Info>
      <Pre>{`// getByLabelText finds the associated input — tests labels are wired correctly
const emailInput = screen.getByLabelText('Email')
await user.type(emailInput, 'alice@example.com')

// getByRole('textbox', { name: 'Email' }) — uses ARIA accessible name
// Same result, different query strategy

// getByRole('button', { name: 'Sign In' }) — finds the submit button
// by accessible name, not text or id

// Why this matters:
// If the label has a typo or is missing the for= attr, your test fails.
// That's a GOOD thing — it caught your a11y bug.`}</Pre>
    </Section>
  )
}

// ─── 6.2 Validation flow ─────────────────────────────────────────────────────

function ValidationSection() {
  return (
    <Section title="6.2 — Validation and error messages">
      <Pre>{`it('shows validation errors for invalid input', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn()
  render(<LoginForm onSubmit={onSubmit} />)

  // Submit without filling anything
  await user.click(screen.getByRole('button', { name: 'Sign In' }))

  // Errors appear as role=alert elements
  expect(screen.getByRole('alert', { name: /email/i })).toBeInTheDocument()
  expect(screen.getByRole('alert', { name: /password/i })).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()
})

it('clears errors and calls onSubmit with valid data', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn()
  render(<LoginForm onSubmit={onSubmit} />)

  await user.type(screen.getByLabelText('Email'), 'alice@example.com')
  await user.type(screen.getByLabelText('Password'), 'supersecret')
  await user.click(screen.getByRole('button', { name: 'Sign In' }))

  expect(screen.queryAllByRole('alert')).toHaveLength(0)
  expect(onSubmit).toHaveBeenCalledWith({
    email: 'alice@example.com',
    password: 'supersecret',
  })
})`}</Pre>
    </Section>
  )
}

// ─── 6.3 Live demo ───────────────────────────────────────────────────────────

function LiveDemoSection() {
  const [submitted, setSubmitted] = useState<LoginData | null>(null)
  return (
    <Section title="6.3 — LoginForm (live)">
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, flex: 1, minWidth: 240 }}>
          <LoginForm onSubmit={setSubmitted} />
        </div>
        {submitted && (
          <div style={{ background: '#0f0f0f', border: '1px solid #4caf50', borderRadius: 3, padding: 14, fontSize: 12 }}>
            <div style={{ color: '#4caf50', marginBottom: 6 }}>Submitted:</div>
            <pre style={{ color: '#7ec8a0' }}>{JSON.stringify(submitted, null, 2)}</pre>
          </div>
        )}
      </div>
    </Section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function FormsExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>06 · Forms</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Testing forms with RTL enforces accessible markup — if your labels aren't associated
        to inputs, getByLabelText will fail, catching the bug before your users do.
      </p>
      <AccessibleFormSection />
      <ValidationSection />
      <LiveDemoSection />
    </div>
  )
}
