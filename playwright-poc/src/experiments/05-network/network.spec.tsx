import { test, expect } from '@playwright/experimental-ct-react'
import { UserFeed, PostForm } from './NetworkExperiment'

// ─── 5.1 Mock successful response ─────────────────────────────────────────────

test.describe('page.route() — mock responses', () => {
  test('renders users from mocked GET response', async ({ mount, page }) => {
    await page.route('**/api/users', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob',   email: 'bob@example.com' },
      ]),
    }))

    const component = await mount(<UserFeed />)
    await expect(component.getByTestId('user-list')).toBeVisible()
    await expect(component.getByText('Alice')).toBeVisible()
    await expect(component.getByText('Bob')).toBeVisible()
    await expect(component.getByRole('listitem')).toHaveCount(2)
  })

  test('shows empty list when API returns empty array', async ({ mount, page }) => {
    await page.route('**/api/users', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }))

    const component = await mount(<UserFeed />)
    // Empty <ul> has zero height — use toHaveCount(0) on listitems instead of toBeVisible() on ul
    await expect(component.getByRole('listitem')).toHaveCount(0)
  })
})

// ─── 5.2 Mock error responses ─────────────────────────────────────────────────

test.describe('Error responses', () => {
  test('shows error on HTTP 500', async ({ mount, page }) => {
    await page.route('**/api/users', route => route.fulfill({
      status: 500,
      body: 'Internal Server Error',
    }))

    const component = await mount(<UserFeed />)
    await expect(component.getByRole('alert')).toBeVisible()
    await expect(component.getByRole('alert')).toContainText('HTTP 500')
  })

  test('shows error on network abort', async ({ mount, page }) => {
    await page.route('**/api/users', route => route.abort())

    const component = await mount(<UserFeed />)
    await expect(component.getByRole('alert')).toBeVisible()
  })
})

// ─── 5.3 Inspect outgoing request ─────────────────────────────────────────────

test.describe('Request inspection', () => {
  test('POST sends correct JSON body', async ({ mount, page }) => {
    let capturedBody: Record<string, unknown> | null = null

    await page.route('**/api/posts', async route => {
      capturedBody = JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>
      await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' })
    })

    const component = await mount(<PostForm />)
    await component.getByLabel('Post title').fill('My Post')
    await component.getByRole('button', { name: 'Publish' }).click()

    await expect(component.getByTestId('success-msg')).toBeVisible()
    expect(capturedBody).toEqual({ title: 'My Post' })
  })

  test('correct Content-Type header on POST', async ({ mount, page }) => {
    let contentType: string | null = null

    await page.route('**/api/posts', async route => {
      contentType = route.request().headers()['content-type'] ?? null
      await route.fulfill({ status: 201, body: '{}' })
    })

    const component = await mount(<PostForm />)
    await component.getByLabel('Post title').fill('Test')
    await component.getByRole('button', { name: 'Publish' }).click()

    await expect(component.getByTestId('success-msg')).toBeVisible()
    expect(contentType).toContain('application/json')
  })
})

// ─── 5.4 waitForResponse ─────────────────────────────────────────────────────

test.describe('page.waitForResponse()', () => {
  test('captures response data', async ({ mount, page }) => {
    await page.route('**/api/users', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 42, name: 'Carol', email: 'carol@example.com' }]),
    }))

    const responsePromise = page.waitForResponse('**/api/users')
    const component = await mount(<UserFeed />)
    const response = await responsePromise

    expect(response.status()).toBe(200)
    const data = await response.json() as Array<{ id: number; name: string }>
    expect(data).toHaveLength(1)
    expect(data[0].name).toBe('Carol')

    await expect(component.getByText('Carol')).toBeVisible()
  })
})
