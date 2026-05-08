import { PageTitle, Subtitle, Section, Label, Title, Code, Note, Divider } from '../shared'

export default function SnapshotsExperiment() {
  return (
    <div>
      <PageTitle>Snapshots</PageTitle>
      <Subtitle>
        toMatchSnapshot(), inline snapshots, custom serializers, and update workflow.
      </Subtitle>

      <Section>
        <Label>4.5.1 — toMatchSnapshot()</Label>
        <Title>External snapshot workflow</Title>
        <Note>
          First run: Jest writes the serialized value to <code>__snapshots__/snapshots.test.ts.snap</code>.
          Subsequent runs: Jest compares against the saved file. Fail = unexpected change.
          Update: <code>jest --updateSnapshot</code> or <code>jest -u</code>.
        </Note>
        <Code>{`test('snapshot of a plain object', () => {
  const config = { timeout: 5000, retries: 3, tags: ['unit', 'fast'] }
  expect(config).toMatchSnapshot()
})

// First run creates __snapshots__/snapshots.test.ts.snap:
// exports[\`snapshot of a plain object 1\`] = \`
// Object {
//   "retries": 3,
//   "tags": Array [
//     "unit",
//     "fast",
//   ],
//   "timeout": 5000,
// }
// \`

// Named snapshot — easier to identify in large snap files
test('named snapshot', () => {
  expect({ id: 1, role: 'admin' }).toMatchSnapshot('user object')
})`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.5.2 — toMatchInlineSnapshot()</Label>
        <Title>Jest rewrites the test file</Title>
        <Note>
          On first run with an empty string argument, Jest <strong>literally rewrites the test file</strong> to insert
          the snapshot inline. This is the most surprising Jest behavior to encounter for the first time.
        </Note>
        <Code>{`test('inline snapshot — jest fills in the string', () => {
  expect({ name: 'Alice', score: 100 }).toMatchInlineSnapshot(\`
    Object {
      "name": "Alice",
      "score": 100,
    }
  \`)
})

// Run with empty arg first, jest writes the snapshot:
// expect({ name: 'Alice', score: 100 }).toMatchInlineSnapshot()
// → becomes the above after jest runs

// Update: just delete the string content and run again
// or run: jest --updateSnapshot`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.5.3 — Custom Serializers</Label>
        <Title>expect.addSnapshotSerializer()</Title>
        <Note>
          Serializers control how Jest formats values before snapshot comparison.
          Add a serializer to produce human-readable output for custom classes or data structures.
        </Note>
        <Code>{`expect.addSnapshotSerializer({
  test(val): val is { __type: string } {
    return val && typeof val === 'object' && '__type' in val
  },
  print(val, serialize) {
    const typed = val as { __type: string; value: unknown }
    return \`<\${typed.__type}>\${serialize(typed.value)}</\${typed.__type}>\`
  },
})

test('custom serializer formats tagged objects', () => {
  expect({ __type: 'Money', value: { amount: 100, currency: 'USD' } })
    .toMatchInlineSnapshot(\`<Money>{"amount": 100, "currency": "USD"}</Money>\`)
})`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.5.4 — When to use snapshots</Label>
        <Title>Good fit vs anti-patterns</Title>
        <Code>{`// GOOD: stable serialized output that's hard to assert property-by-property
test('config schema snapshot', () => {
  expect(generateDefaultConfig()).toMatchSnapshot()
})

// GOOD: error message format
test('error message format', () => {
  expect(buildErrorMessage('NOT_FOUND', 'user')).toMatchInlineSnapshot(
    \`"Error NOT_FOUND: user not found"\`
  )
})

// BAD: React component output (use RTL assertions instead)
// Snapshots of component HTML break on any markup change,
// including safe refactors like adding a wrapper div.
// RTL tests survive this because they query by role/text.

// BAD: large dynamic data with timestamps or IDs
// Always replace dynamic fields before snapshotting:
expect({ ...response, createdAt: '[DATE]', id: '[ID]' }).toMatchSnapshot()`}</Code>
      </Section>
    </div>
  )
}
