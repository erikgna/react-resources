import { test, expect } from '@playwright/experimental-ct-react'
import { Counter, TextForm, SelectForm, HoverCard } from './ActionsExperiment'

// ─── 2.1 click() ─────────────────────────────────────────────────────────────

test.describe('click()', () => {
  test('increments counter on click', async ({ mount }) => {
    const component = await mount(<Counter />)
    const count = component.getByTestId('count')
    await expect(count).toHaveText('0')
    await component.getByRole('button', { name: 'Increment' }).click()
    await expect(count).toHaveText('1')
    await component.getByRole('button', { name: 'Increment' }).click()
    await expect(count).toHaveText('2')
  })

  test('decrements counter on click', async ({ mount }) => {
    const component = await mount(<Counter />)
    await component.getByRole('button', { name: 'Increment' }).click()
    await component.getByRole('button', { name: 'Decrement' }).click()
    await expect(component.getByTestId('count')).toHaveText('0')
  })
})

// ─── 2.2 fill() ──────────────────────────────────────────────────────────────

test.describe('fill()', () => {
  test('sets input value and shows preview', async ({ mount }) => {
    const component = await mount(<TextForm />)
    await component.getByLabel('Message').fill('Hello world')
    await expect(component.getByTestId('preview')).toContainText('Hello world')
  })

  test('fill() replaces existing value', async ({ mount }) => {
    const component = await mount(<TextForm />)
    await component.getByLabel('Message').fill('First')
    await component.getByLabel('Message').fill('Second')
    await expect(component.getByLabel('Message')).toHaveValue('Second')
  })

  test('clear() empties the field', async ({ mount }) => {
    const component = await mount(<TextForm />)
    await component.getByLabel('Message').fill('Something')
    await component.getByLabel('Message').clear()
    await expect(component.getByLabel('Message')).toHaveValue('')
  })
})

// ─── 2.3 pressSequentially() — char-by-char typing ───────────────────────────

test.describe('pressSequentially()', () => {
  test('types each character individually', async ({ mount }) => {
    const component = await mount(<TextForm />)
    await component.getByLabel('Message').pressSequentially('abc')
    await expect(component.getByLabel('Message')).toHaveValue('abc')
  })
})

// ─── 2.4 press() ─────────────────────────────────────────────────────────────

test.describe('press()', () => {
  test('Enter submits the form', async ({ mount }) => {
    const submitted: string[] = []
    const component = await mount(<TextForm onSubmit={v => submitted.push(v)} />)
    await component.getByLabel('Message').fill('test value')
    await component.getByLabel('Message').press('Enter')
    expect(submitted).toEqual(['test value'])
  })
})

// ─── 2.5 hover() ─────────────────────────────────────────────────────────────

test.describe('hover()', () => {
  test('shows tooltip on hover', async ({ mount }) => {
    const component = await mount(<HoverCard />)
    await expect(component.getByRole('tooltip')).not.toBeVisible()
    await component.getByRole('button', { name: 'Hover me' }).hover()
    await expect(component.getByRole('tooltip')).toBeVisible()
    await expect(component.getByRole('tooltip')).toHaveText('Tooltip content')
  })
})

// ─── 2.6 selectOption() / check() ────────────────────────────────────────────

test.describe('selectOption()', () => {
  test('selects dropdown option by value', async ({ mount }) => {
    const component = await mount(<SelectForm />)
    await component.getByLabel('Fruit').selectOption('banana')
    await expect(component.getByTestId('fruit-display')).toHaveText('banana')
  })

  test('selects dropdown option by label', async ({ mount }) => {
    const component = await mount(<SelectForm />)
    await component.getByLabel('Fruit').selectOption({ label: 'Cherry' })
    await expect(component.getByTestId('fruit-display')).toHaveText('cherry')
  })
})

test.describe('check() / uncheck()', () => {
  test('checks the checkbox', async ({ mount }) => {
    const component = await mount(<SelectForm />)
    const checkbox = component.getByLabel('I agree')
    await expect(checkbox).not.toBeChecked()
    await checkbox.check()
    await expect(checkbox).toBeChecked()
    await expect(component.getByTestId('agree-display')).toHaveText('yes')
  })

  test('unchecks the checkbox', async ({ mount }) => {
    const component = await mount(<SelectForm />)
    await component.getByLabel('I agree').check()
    await component.getByLabel('I agree').uncheck()
    await expect(component.getByLabel('I agree')).not.toBeChecked()
  })

  test('checks radio button', async ({ mount }) => {
    const component = await mount(<SelectForm />)
    await component.getByRole('radio', { name: 'L' }).check()
    await expect(component.getByTestId('size-display')).toHaveText('l')
  })
})
