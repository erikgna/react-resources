# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 08-failures/failures.spec.tsx >> expect.soft() — collect all failures >> soft assertions all run even when first fails
- Location: src/experiments/08-failures/failures.spec.tsx:105:8

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('#root').locator('internal:control=component').getByRole('button')
Expected: 99
Received: 2
Timeout:  5000ms

Call log:
  - Expect "soft toHaveCount" with timeout 5000ms
  - waiting for locator('#root').locator('internal:control=component').getByRole('button')
    9 × locator resolved to 2 elements
      - unexpected value "2"

```

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#root').locator('internal:control=component').getByText('Save')
Expected: visible
Error: strict mode violation: locator('#root').locator('internal:control=component').getByText('Save') resolved to 2 elements:
    1) <button>Save</button> aka getByRole('button', { name: 'Save', exact: true })
    2) <button>Save draft</button> aka getByRole('button', { name: 'Save draft' })

Call log:
  - Expect "soft toBeVisible" with timeout 5000ms
  - waiting for locator('#root').locator('internal:control=component').getByText('Save')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - button "Save" [ref=e4] [cursor=pointer]
  - button "Save draft" [ref=e5] [cursor=pointer]
```

# Test source

```ts
  9   |     // Exact match finds only the button labeled exactly "Save"
  10  |     await expect(component.getByText('Save', { exact: true })).toHaveCount(1)
  11  |   })
  12  | 
  13  |   test('getByRole with exact name does not match substrings', async ({ mount }) => {
  14  |     const component = await mount(<TwoButtons />)
  15  |     // Without exact:true, 'Save' matches 'Save draft' (substring). Use exact:true.
  16  |     await expect(component.getByRole('button', { name: 'Save', exact: true })).toHaveCount(1)
  17  |     await expect(component.getByRole('button', { name: 'Save draft', exact: true })).toHaveCount(1)
  18  |   })
  19  | 
  20  |   test('strict mode throws on multiple matches', async ({ mount }) => {
  21  |     const component = await mount(<TwoButtons />)
  22  |     // Verify there ARE multiple matches before attempting to click
  23  |     await expect(component.getByText(/save/i)).toHaveCount(2)
  24  |     // This would fail: component.getByText(/save/i).click() — strict mode violation
  25  |   })
  26  | 
  27  |   test('first() resolves strict mode by index', async ({ mount }) => {
  28  |     const component = await mount(<TwoButtons />)
  29  |     await expect(component.getByText(/save/i).first()).toHaveText('Save')
  30  |   })
  31  | })
  32  | 
  33  | // ─── 8.2 Timeout error simulation ────────────────────────────────────────────
  34  | 
  35  | test.describe('Timeout behavior', () => {
  36  |   test('short timeout fails fast for slow element', async ({ mount }) => {
  37  |     const component = await mount(<SlowAppear delayMs={5000} />)
  38  |     await component.getByRole('button', { name: 'Trigger' }).click()
  39  | 
  40  |     let threw = false
  41  |     try {
  42  |       await component.getByTestId('result').waitFor({ state: 'visible', timeout: 100 })
  43  |     } catch {
  44  |       threw = true
  45  |     }
  46  |     expect(threw).toBe(true)
  47  |   })
  48  | 
  49  |   test('fast element succeeds with tight timeout', async ({ mount }) => {
  50  |     const component = await mount(<SlowAppear delayMs={50} />)
  51  |     await component.getByRole('button', { name: 'Trigger' }).click()
  52  |     await component.getByTestId('result').waitFor({ state: 'visible', timeout: 500 })
  53  |     await expect(component.getByTestId('result')).toHaveText('Appeared')
  54  |   })
  55  | })
  56  | 
  57  | // ─── 8.3 Actionability ───────────────────────────────────────────────────────
  58  | 
  59  | test.describe('Actionability checks', () => {
  60  |   test('disabled button is disabled', async ({ mount }) => {
  61  |     const component = await mount(<DisabledButton />)
  62  |     // getByRole('button') excludes disabled buttons from ARIA tree in Playwright CT.
  63  |     // Use CSS selector or explicit name for disabled elements.
  64  |     await expect(component.locator('button')).toBeDisabled()
  65  |   })
  66  | 
  67  |   test('disabled button is visible but not enabled', async ({ mount }) => {
  68  |     const component = await mount(<DisabledButton />)
  69  |     await expect(component.locator('button')).toBeVisible()
  70  |     await expect(component.locator('button')).toBeDisabled()
  71  |   })
  72  | 
  73  |   test('hidden element passes not.toBeVisible', async ({ mount }) => {
  74  |     const component = await mount(<HiddenTarget />)
  75  |     // visibility:hidden — element is in DOM but not visible
  76  |     await expect(component.getByTestId('hidden-span')).not.toBeVisible()
  77  |   })
  78  | })
  79  | 
  80  | // ─── 8.4 Debugging — verify locator before acting ────────────────────────────
  81  | 
  82  | test.describe('Locator diagnostics', () => {
  83  |   test('count() reveals how many elements a locator matches', async ({ mount }) => {
  84  |     const component = await mount(<TwoButtons />)
  85  |     const count = await component.getByRole('button').count()
  86  |     expect(count).toBe(2)
  87  |   })
  88  | 
  89  |   test('allTextContents() reveals what locator matches', async ({ mount }) => {
  90  |     const component = await mount(<TwoButtons />)
  91  |     const texts = await component.getByRole('button').allTextContents()
  92  |     expect(texts).toEqual(['Save', 'Save draft'])
  93  |   })
  94  | 
  95  |   test('innerHTML() for DOM inspection', async ({ mount }) => {
  96  |     const component = await mount(<TwoButtons />)
  97  |     const html = await component.innerHTML()
  98  |     expect(html).toContain('Save')
  99  |   })
  100 | })
  101 | 
  102 | // ─── 8.5 expect.soft() prevents early abort ──────────────────────────────────
  103 | 
  104 | test.describe('expect.soft() — collect all failures', () => {
  105 |   test.fail('soft assertions all run even when first fails', async ({ mount }) => {
  106 |     const component = await mount(<TwoButtons />)
  107 |     // All three soft assertions run before reporting failure
  108 |     await expect.soft(component.getByRole('button')).toHaveCount(99)    // fails
> 109 |     await expect.soft(component.getByText('Save')).toBeVisible()         // passes
      |                                                    ^ Error: expect(locator).toBeVisible() failed
  110 |     await expect.soft(component.getByText('Save draft')).toBeVisible()   // passes
  111 |     // Test marked as "expected to fail" (test.fail) — validates soft assertion behavior
  112 |   })
  113 | })
  114 | 
```