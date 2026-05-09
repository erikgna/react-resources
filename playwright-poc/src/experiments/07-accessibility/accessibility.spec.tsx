import { test, expect } from '@playwright/experimental-ct-react'
import { AccessibleForm, FocusTrap, LiveRegion } from './AccessibilityExperiment'

// ─── 7.1 Role-first locators ─────────────────────────────────────────────────

test.describe('Role-first locators as a11y validation', () => {
  test('form inputs are findable by role + label', async ({ mount }) => {
    const component = await mount(<AccessibleForm />)
    await expect(component.getByRole('textbox', { name: 'Name *' })).toBeVisible()
    await expect(component.getByRole('textbox', { name: 'Email *' })).toBeVisible()
    await expect(component.getByRole('button', { name: 'Submit' })).toBeVisible()
  })

  test('successful submission shows status', async ({ mount }) => {
    const component = await mount(<AccessibleForm />)
    await component.getByRole('textbox', { name: 'Name *' }).fill('Alice')
    await component.getByRole('textbox', { name: 'Email *' }).fill('alice@example.com')
    await component.getByRole('button', { name: 'Submit' }).click()
    await expect(component.getByRole('status')).toHaveText('Form submitted!')
  })
})

// ─── 7.2 ARIA attributes ─────────────────────────────────────────────────────

test.describe('ARIA attributes on validation', () => {
  test('aria-invalid set on error', async ({ mount }) => {
    const component = await mount(<AccessibleForm />)
    await component.getByRole('button', { name: 'Submit' }).click()
    const nameInput = component.getByRole('textbox', { name: 'Name *' })
    await expect(nameInput).toHaveAttribute('aria-invalid', 'true')
  })

  test('aria-describedby links input to error message', async ({ mount }) => {
    const component = await mount(<AccessibleForm />)
    await component.getByRole('button', { name: 'Submit' }).click()
    const nameInput = component.getByRole('textbox', { name: 'Name *' })
    await expect(nameInput).toHaveAttribute('aria-describedby', 'name-error')
  })

  test('error messages use role="alert"', async ({ mount }) => {
    const component = await mount(<AccessibleForm />)
    await component.getByRole('button', { name: 'Submit' }).click()
    const alerts = component.getByRole('alert')
    await expect(alerts).toHaveCount(2) // name + email errors
  })

  test('aria-invalid cleared after fixing both fields and re-submitting', async ({ mount }) => {
    const component = await mount(<AccessibleForm />)
    await component.getByRole('button', { name: 'Submit' }).click()
    await expect(component.getByRole('textbox', { name: 'Name *' })).toHaveAttribute('aria-invalid', 'true')

    // Fix both fields and re-submit — errors state is cleared on next submit call
    await component.getByRole('textbox', { name: 'Name *' }).fill('Bob')
    await component.getByRole('textbox', { name: 'Email *' }).fill('bob@example.com')
    await component.getByRole('button', { name: 'Submit' }).click()
    // Successful submit: form is replaced by status div
    await expect(component.getByRole('status')).toHaveText('Form submitted!')
  })
})

// ─── 7.3 Focus management ────────────────────────────────────────────────────

test.describe('Focus management in modal', () => {
  test('focus moves to first button when dialog opens', async ({ mount }) => {
    const component = await mount(<FocusTrap />)
    await component.getByRole('button', { name: 'Open modal' }).click()
    const dialog = component.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Confirm' })).toBeFocused()
  })

  test('dialog closes on Confirm click', async ({ mount }) => {
    const component = await mount(<FocusTrap />)
    await component.getByRole('button', { name: 'Open modal' }).click()
    await component.getByRole('button', { name: 'Confirm' }).click()
    await expect(component.getByRole('dialog')).not.toBeVisible()
  })

  test('dialog closes on Cancel click', async ({ mount }) => {
    const component = await mount(<FocusTrap />)
    await component.getByRole('button', { name: 'Open modal' }).click()
    await component.getByRole('button', { name: 'Cancel' }).click()
    await expect(component.getByRole('dialog')).not.toBeVisible()
  })
})

// ─── 7.4 Keyboard navigation ─────────────────────────────────────────────────

test.describe('Keyboard navigation', () => {
  test('Tab moves focus through form fields in order', async ({ mount, page }) => {
    const component = await mount(<AccessibleForm />)
    await component.getByRole('textbox', { name: 'Name *' }).focus()
    await expect(component.getByRole('textbox', { name: 'Name *' })).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(component.getByRole('textbox', { name: 'Email *' })).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(component.getByRole('button', { name: 'Submit' })).toBeFocused()
  })
})

// ─── 7.5 aria-live region ────────────────────────────────────────────────────

test.describe('aria-live regions', () => {
  test('live region updates on notification', async ({ mount }) => {
    const component = await mount(<LiveRegion />)
    const log = component.getByRole('log', { name: 'Notifications' })

    await component.getByRole('button', { name: 'Add notification' }).click()
    await expect(log).toContainText('Notification 1')
  })

  test('multiple notifications accumulate', async ({ mount }) => {
    const component = await mount(<LiveRegion />)
    const log = component.getByRole('log', { name: 'Notifications' })

    await component.getByRole('button', { name: 'Add notification' }).click()
    await component.getByRole('button', { name: 'Add notification' }).click()
    await component.getByRole('button', { name: 'Add notification' }).click()

    await expect(log.getByText('Notification 1')).toBeVisible()
    await expect(log.getByText('Notification 3')).toBeVisible()
  })

  test('log has correct ARIA role and label', async ({ mount }) => {
    const component = await mount(<LiveRegion />)
    const log = component.getByRole('log', { name: 'Notifications' })
    await expect(log).toBeVisible()
    await expect(log).toHaveAttribute('aria-live', 'polite')
  })
})
