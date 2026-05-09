import { test, expect } from '@playwright/experimental-ct-react'
import { ToggleBox, DisabledField, CheckboxGroup, ColorBox, FocusTarget } from './AssertionsExperiment'

// ─── 3.1 Visibility ───────────────────────────────────────────────────────────

test.describe('toBeVisible() / toBeHidden()', () => {
  test('visible element passes toBeVisible', async ({ mount }) => {
    const component = await mount(<ToggleBox />)
    await expect(component.getByTestId('box')).toBeVisible()
  })

  test('hidden element passes toBeHidden after toggle', async ({ mount }) => {
    const component = await mount(<ToggleBox />)
    await component.getByRole('button', { name: 'Hide' }).click()
    await expect(component.getByTestId('box')).toBeHidden()
  })

  test('absent element passes not.toBeVisible', async ({ mount }) => {
    const component = await mount(<ToggleBox />)
    await component.getByRole('button', { name: 'Hide' }).click()
    await expect(component.getByText('I am visible')).not.toBeVisible()
  })
})

// ─── 3.2 Text assertions ──────────────────────────────────────────────────────

test.describe('toHaveText() / toContainText()', () => {
  test('toHaveText matches exact trimmed text', async ({ mount }) => {
    const component = await mount(<ToggleBox />)
    await expect(component.getByTestId('box')).toHaveText('I am visible')
  })

  test('toHaveText matches regex', async ({ mount }) => {
    const component = await mount(<ToggleBox />)
    await expect(component.getByTestId('box')).toHaveText(/visible/)
  })

  test('toContainText matches substring', async ({ mount }) => {
    const component = await mount(<CheckboxGroup />)
    await expect(component.getByTestId('checked-count')).toContainText('selected')
  })
})

// ─── 3.3 toHaveValue() ───────────────────────────────────────────────────────

test.describe('toHaveValue()', () => {
  test('reflects current input value', async ({ mount }) => {
    const component = await mount(<DisabledField />)
    await component.getByLabel('Enable field').check()
    await component.getByTestId('controlled-input').fill('hello')
    await expect(component.getByTestId('controlled-input')).toHaveValue('hello')
  })
})

// ─── 3.4 toHaveAttribute() ───────────────────────────────────────────────────

test.describe('toHaveAttribute()', () => {
  test('checks html attribute value', async ({ mount }) => {
    const component = await mount(<DisabledField />)
    await expect(component.getByTestId('controlled-input')).toHaveAttribute('placeholder', 'Only when enabled')
  })
})

// ─── 3.5 toBeEnabled() / toBeDisabled() ──────────────────────────────────────

test.describe('toBeEnabled() / toBeDisabled()', () => {
  test('input is disabled by default', async ({ mount }) => {
    const component = await mount(<DisabledField />)
    await expect(component.getByTestId('controlled-input')).toBeDisabled()
  })

  test('input becomes enabled after checkbox', async ({ mount }) => {
    const component = await mount(<DisabledField />)
    await component.getByLabel('Enable field').check()
    await expect(component.getByTestId('controlled-input')).toBeEnabled()
  })
})

// ─── 3.6 toHaveCount() ───────────────────────────────────────────────────────

test.describe('toHaveCount()', () => {
  test('counts all checkboxes in group', async ({ mount }) => {
    const component = await mount(<CheckboxGroup />)
    await expect(component.getByRole('checkbox')).toHaveCount(3)
  })
})

// ─── 3.7 toBeChecked() ───────────────────────────────────────────────────────

test.describe('toBeChecked()', () => {
  test('Beta starts checked', async ({ mount }) => {
    const component = await mount(<CheckboxGroup />)
    await expect(component.getByRole('checkbox', { name: 'Beta' })).toBeChecked()
    await expect(component.getByRole('checkbox', { name: 'Alpha' })).not.toBeChecked()
  })

  test('clicking checkbox toggles checked state', async ({ mount }) => {
    const component = await mount(<CheckboxGroup />)
    await component.getByRole('checkbox', { name: 'Alpha' }).check()
    await expect(component.getByRole('checkbox', { name: 'Alpha' })).toBeChecked()
    await expect(component.getByTestId('checked-count')).toContainText('2 selected')
  })
})

// ─── 3.8 toBeFocused() ───────────────────────────────────────────────────────

test.describe('toBeFocused()', () => {
  test('input becomes focused after focus()', async ({ mount }) => {
    const component = await mount(<FocusTarget />)
    const input = component.getByTestId('focus-input')
    await input.focus()
    await expect(input).toBeFocused()
  })
})

// ─── 3.9 toHaveCSS() ─────────────────────────────────────────────────────────

test.describe('toHaveCSS()', () => {
  test('checks computed background color', async ({ mount }) => {
    const component = await mount(<ColorBox />)
    const box = component.getByTestId('color-box')
    await expect(box).toHaveCSS('background-color', 'rgb(74, 158, 255)')
  })

  test('color changes after click', async ({ mount }) => {
    const component = await mount(<ColorBox />)
    await component.getByRole('button', { name: 'Turn red' }).click()
    await expect(component.getByTestId('color-box')).toHaveCSS('background-color', 'rgb(255, 107, 107)')
  })
})

// ─── 3.10 Soft assertions ─────────────────────────────────────────────────────

test.describe('expect.soft() — collect all failures', () => {
  test('soft assertions accumulate without stopping test', async ({ mount }) => {
    const component = await mount(<CheckboxGroup />)
    // All soft assertions run regardless of earlier failures.
    // If any fail, the test is marked failed after all run.
    expect.soft(await component.getByRole('checkbox').count()).toBe(3)
    await expect.soft(component.getByRole('checkbox', { name: 'Beta' })).toBeChecked()
    await expect.soft(component.getByTestId('checked-count')).toContainText('selected')
  })
})
