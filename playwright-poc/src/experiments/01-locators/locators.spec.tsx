import { test, expect } from '@playwright/experimental-ct-react'
import { GreetingCard, UserList, ProductList } from './LocatorsExperiment'

// ─── 1.1 getByRole ────────────────────────────────────────────────────────────

test.describe('getByRole', () => {
  test('finds heading by implicit role and accessible name', async ({ mount }) => {
    const component = await mount(<GreetingCard name="Alice" role="Admin" />)
    const heading = component.getByRole('heading', { name: /welcome, alice/i })
    await expect(heading).toBeVisible()
    await expect(heading).toHaveText('Welcome, Alice')
  })

  test('finds button by aria-label', async ({ mount }) => {
    const component = await mount(<GreetingCard name="Alice" role="Admin" />)
    await expect(component.getByRole('button', { name: 'Close card' })).toBeVisible()
  })

  test('finds textbox by associated label (for/id pair)', async ({ mount }) => {
    const component = await mount(<GreetingCard name="Alice" role="Admin" />)
    const emailInput = component.getByRole('textbox', { name: 'Email' })
    await expect(emailInput).toBeVisible()
    await expect(emailInput).toHaveAttribute('type', 'email')
  })
})

// ─── 1.2 getByText ────────────────────────────────────────────────────────────

test.describe('getByText', () => {
  test('exact text match', async ({ mount }) => {
    const component = await mount(<GreetingCard name="Bob" role="Viewer" />)
    await expect(component.getByText('Welcome, Bob')).toBeVisible()
  })

  test('regex match', async ({ mount }) => {
    const component = await mount(<GreetingCard name="Bob" role="Viewer" />)
    await expect(component.getByText(/welcome/i)).toBeVisible()
  })
})

// ─── 1.3 getByLabel ──────────────────────────────────────────────────────────

test.describe('getByLabel', () => {
  test('finds input via label[for] + input[id] association', async ({ mount }) => {
    const component = await mount(<GreetingCard name="Dana" role="Editor" />)
    const input = component.getByLabel('Email')
    await expect(input).toBeVisible()
    await expect(input).toHaveAttribute('type', 'email')
  })
})

// ─── 1.4 getByPlaceholder ────────────────────────────────────────────────────

test.describe('getByPlaceholder', () => {
  test('finds input by placeholder attribute', async ({ mount }) => {
    const component = await mount(<GreetingCard name="Eve" role="Viewer" />)
    await expect(component.getByPlaceholder('Search...')).toBeVisible()
  })
})

// ─── 1.5 getByAltText ────────────────────────────────────────────────────────

test.describe('getByAltText', () => {
  test('finds image by alt attribute', async ({ mount }) => {
    const component = await mount(<GreetingCard name="Frank" role="Admin" />)
    const img = component.getByAltText('Profile photo')
    await expect(img).toBeVisible()
  })
})

// ─── 1.6 getByTestId — last resort ───────────────────────────────────────────

test.describe('getByTestId', () => {
  test('finds element by data-testid', async ({ mount }) => {
    const component = await mount(<GreetingCard name="Grace" role="Admin" />)
    await expect(component.getByTestId('role-label')).toContainText('Role: Admin')
  })
})

// ─── 1.7 Locator chaining (scoping) ──────────────────────────────────────────

test.describe('Locator chaining — scoped queries', () => {
  test('disambiguates duplicate buttons by chaining from unique parent', async ({ mount }) => {
    const component = await mount(<UserList />)
    const aliceRow = component.getByTestId('user-alice')
    const editBtn = aliceRow.getByRole('button', { name: 'Edit' })
    await expect(editBtn).toBeVisible()
  })

  test('chained locator only sees elements inside its parent', async ({ mount }) => {
    const component = await mount(<UserList />)
    const aliceRow = component.getByTestId('user-alice')
    await expect(aliceRow.getByText('Alice')).toBeVisible()
    await expect(aliceRow.getByText('Bob')).not.toBeVisible()
  })
})

// ─── 1.8 filter() ────────────────────────────────────────────────────────────

test.describe('filter() — content-based disambiguation', () => {
  test('targets specific list item by text', async ({ mount }) => {
    const component = await mount(<ProductList />)
    const bananaRow = component.getByRole('listitem').filter({ hasText: 'Banana' })
    await expect(bananaRow).toHaveCount(1)
    await expect(bananaRow.getByRole('button')).toHaveText('Add to cart')
  })

  test('filter excludes non-matching items', async ({ mount }) => {
    const component = await mount(<ProductList />)
    const appleRows = component.getByRole('listitem').filter({ hasText: 'Apple' })
    await expect(appleRows).toHaveCount(1)
  })
})

// ─── 1.9 first() / last() / nth() ────────────────────────────────────────────

test.describe('first() / last() / nth()', () => {
  test('first() targets first list item', async ({ mount }) => {
    const component = await mount(<ProductList />)
    await expect(component.getByRole('listitem').first()).toContainText('Apple')
  })

  test('last() targets last list item', async ({ mount }) => {
    const component = await mount(<ProductList />)
    await expect(component.getByRole('listitem').last()).toContainText('Cherry')
  })

  test('nth(n) is 0-indexed', async ({ mount }) => {
    const component = await mount(<ProductList />)
    await expect(component.getByRole('listitem').nth(1)).toContainText('Banana')
  })

  test('toHaveCount verifies list length before indexing', async ({ mount }) => {
    const component = await mount(<ProductList />)
    await expect(component.getByRole('listitem')).toHaveCount(3)
  })
})
