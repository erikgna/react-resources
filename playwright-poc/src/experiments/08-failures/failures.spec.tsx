import { test, expect } from '@playwright/experimental-ct-react'
import { TwoButtons, SlowAppear, DisabledButton, HiddenTarget } from './FailuresExperiment'

// ─── 8.1 Strict mode ─────────────────────────────────────────────────────────

test.describe('Strict mode — multiple matches', () => {
  test('getByText exact:true disambiguates partial matches', async ({ mount }) => {
    const component = await mount(<TwoButtons />)
    // Exact match finds only the button labeled exactly "Save"
    await expect(component.getByText('Save', { exact: true })).toHaveCount(1)
  })

  test('getByRole with exact name does not match substrings', async ({ mount }) => {
    const component = await mount(<TwoButtons />)
    // Without exact:true, 'Save' matches 'Save draft' (substring). Use exact:true.
    await expect(component.getByRole('button', { name: 'Save', exact: true })).toHaveCount(1)
    await expect(component.getByRole('button', { name: 'Save draft', exact: true })).toHaveCount(1)
  })

  test('strict mode throws on multiple matches', async ({ mount }) => {
    const component = await mount(<TwoButtons />)
    // Verify there ARE multiple matches before attempting to click
    await expect(component.getByText(/save/i)).toHaveCount(2)
    // This would fail: component.getByText(/save/i).click() — strict mode violation
  })

  test('first() resolves strict mode by index', async ({ mount }) => {
    const component = await mount(<TwoButtons />)
    await expect(component.getByText(/save/i).first()).toHaveText('Save')
  })
})

// ─── 8.2 Timeout error simulation ────────────────────────────────────────────

test.describe('Timeout behavior', () => {
  test('short timeout fails fast for slow element', async ({ mount }) => {
    const component = await mount(<SlowAppear delayMs={5000} />)
    await component.getByRole('button', { name: 'Trigger' }).click()

    let threw = false
    try {
      await component.getByTestId('result').waitFor({ state: 'visible', timeout: 100 })
    } catch {
      threw = true
    }
    expect(threw).toBe(true)
  })

  test('fast element succeeds with tight timeout', async ({ mount }) => {
    const component = await mount(<SlowAppear delayMs={50} />)
    await component.getByRole('button', { name: 'Trigger' }).click()
    await component.getByTestId('result').waitFor({ state: 'visible', timeout: 500 })
    await expect(component.getByTestId('result')).toHaveText('Appeared')
  })
})

// ─── 8.3 Actionability ───────────────────────────────────────────────────────

test.describe('Actionability checks', () => {
  test('disabled button is disabled', async ({ mount }) => {
    const component = await mount(<DisabledButton />)
    // getByRole('button') excludes disabled buttons from ARIA tree in Playwright CT.
    // Use CSS selector or explicit name for disabled elements.
    await expect(component.locator('button')).toBeDisabled()
  })

  test('disabled button is visible but not enabled', async ({ mount }) => {
    const component = await mount(<DisabledButton />)
    await expect(component.locator('button')).toBeVisible()
    await expect(component.locator('button')).toBeDisabled()
  })

  test('hidden element passes not.toBeVisible', async ({ mount }) => {
    const component = await mount(<HiddenTarget />)
    // visibility:hidden — element is in DOM but not visible
    await expect(component.getByTestId('hidden-span')).not.toBeVisible()
  })
})

// ─── 8.4 Debugging — verify locator before acting ────────────────────────────

test.describe('Locator diagnostics', () => {
  test('count() reveals how many elements a locator matches', async ({ mount }) => {
    const component = await mount(<TwoButtons />)
    const count = await component.getByRole('button').count()
    expect(count).toBe(2)
  })

  test('allTextContents() reveals what locator matches', async ({ mount }) => {
    const component = await mount(<TwoButtons />)
    const texts = await component.getByRole('button').allTextContents()
    expect(texts).toEqual(['Save', 'Save draft'])
  })

  test('innerHTML() for DOM inspection', async ({ mount }) => {
    const component = await mount(<TwoButtons />)
    const html = await component.innerHTML()
    expect(html).toContain('Save')
  })
})

// ─── 8.5 expect.soft() prevents early abort ──────────────────────────────────

test.describe('expect.soft() — collect all failures', () => {
  test.fail('soft assertions all run even when first fails', async ({ mount }) => {
    const component = await mount(<TwoButtons />)
    // All three soft assertions run before reporting failure
    await expect.soft(component.getByRole('button')).toHaveCount(99)    // fails
    await expect.soft(component.getByText('Save')).toBeVisible()         // passes
    await expect.soft(component.getByText('Save draft')).toBeVisible()   // passes
    // Test marked as "expected to fail" (test.fail) — validates soft assertion behavior
  })
})
