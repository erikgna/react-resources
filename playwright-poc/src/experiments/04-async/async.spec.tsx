import { test, expect } from '@playwright/experimental-ct-react'
import { DelayedContent, SearchDebounce, StepLoader } from './AsyncExperiment'

// ─── 4.1 Auto-waiting ─────────────────────────────────────────────────────────

test.describe('Auto-waiting — no explicit waitFor needed', () => {
  test('waits for delayed content without manual waitFor', async ({ mount }) => {
    const component = await mount(<DelayedContent delayMs={300} />)
    // No waitFor — expect retries automatically
    await expect(component.getByTestId('result')).toBeVisible()
    await expect(component.getByTestId('result')).toHaveText('Loaded item')
  })

  test('loading indicator disappears after data loads', async ({ mount }) => {
    const component = await mount(<DelayedContent delayMs={200} />)
    // Loading indicator is visible initially
    await expect(component.getByRole('status', { name: 'Loading' })).toBeVisible()
    // Auto-waits for it to disappear
    await expect(component.getByRole('status', { name: 'Loading' })).not.toBeVisible()
  })
})

// ─── 4.2 State transitions ────────────────────────────────────────────────────

test.describe('Loading → Done state transitions', () => {
  test('button triggers loading then done state', async ({ mount }) => {
    const component = await mount(<StepLoader />)

    await component.getByRole('button', { name: 'Start' }).click()

    // Button is disabled during loading
    await expect(component.getByRole('button', { name: 'Start' })).toBeDisabled()

    // Done indicator appears automatically
    await expect(component.getByTestId('done-indicator')).toBeVisible()

    // Loading spinner is gone
    await expect(component.getByRole('status')).not.toBeVisible()
  })
})

// ─── 4.3 Debounced input ─────────────────────────────────────────────────────

test.describe('Debounced updates', () => {
  test('search result appears after debounce window', async ({ mount }) => {
    const component = await mount(<SearchDebounce debounceMs={300} />)
    await component.getByLabel('Search').fill('playwright')
    // Auto-waits beyond the debounce window
    await expect(component.getByTestId('search-result'))
      .toHaveText('Results for: playwright')
  })

  test('no result shown when input is cleared', async ({ mount }) => {
    const component = await mount(<SearchDebounce debounceMs={100} />)
    await component.getByLabel('Search').fill('test')
    await expect(component.getByTestId('search-result')).toBeVisible()
    await component.getByLabel('Search').clear()
    await expect(component.getByTestId('search-result')).not.toBeVisible()
  })
})

// ─── 4.4 locator.waitFor() ────────────────────────────────────────────────────

test.describe('locator.waitFor() — explicit waiting', () => {
  test('waitFor({ state: visible }) resolves when element appears', async ({ mount }) => {
    const component = await mount(<DelayedContent delayMs={200} />)
    await component.getByTestId('result').waitFor({ state: 'visible' })
    await expect(component.getByTestId('result')).toHaveText('Loaded item')
  })

  test('waitFor({ state: hidden }) resolves when loading disappears', async ({ mount }) => {
    const component = await mount(<DelayedContent delayMs={200} />)
    await component.getByRole('status', { name: 'Loading' }).waitFor({ state: 'hidden' })
    await expect(component.getByTestId('result')).toBeVisible()
  })
})

// ─── 4.5 Custom timeout ───────────────────────────────────────────────────────

test.describe('Custom assertion timeouts', () => {
  test('per-assertion timeout overrides default', async ({ mount }) => {
    const component = await mount(<DelayedContent delayMs={100} />)
    await expect(component.getByTestId('result'))
      .toBeVisible({ timeout: 1000 })
  })
})
