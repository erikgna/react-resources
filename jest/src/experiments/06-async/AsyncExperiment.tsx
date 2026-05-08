import { PageTitle, Subtitle, Section, Label, Title, Code, Note, Divider } from '../shared'

export default function AsyncExperiment() {
  return (
    <div>
      <PageTitle>Async Testing</PageTitle>
      <Subtitle>
        done callback, returned Promises, async/await, and .resolves/.rejects matchers.
        Pitfalls that cause false positives.
      </Subtitle>

      <Section>
        <Label>4.6.1 — done callback (legacy)</Label>
        <Title>Callback-style async</Title>
        <Note>
          <code>done</code> tells Jest to wait for the callback before finishing the test.
          If <code>done</code> is never called, the test times out. If called with an argument, it fails.
          The critical pitfall: forgetting <code>done</code> in a catch block causes a false positive.
        </Note>
        <Code>{`// Correct pattern with done + try/catch
test('callback async', (done) => {
  fetchData((error, data) => {
    try {
      expect(error).toBeNull()
      expect(data).toBeDefined()
      done()
    } catch (e) {
      done(e)   // ← MUST pass error to done, otherwise test passes silently
    }
  })
})

// Anti-pattern: done missing from catch → false positive
test('silent false positive (anti-pattern)', (done) => {
  fetchData((error, data) => {
    expect(data.name).toBe('wrong value')   // throws
    done()   // never reached → test TIMES OUT, not fails with assertion error
    // Without done(e) in catch, you lose the failure reason
  })
})`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.6.2 — Return a Promise</Label>
        <Title>Simplest async pattern</Title>
        <Note>
          Return the Promise from the test function. Jest waits for it to resolve or reject.
          If you forget to return, Jest won't wait and the test may pass before assertions run.
        </Note>
        <Code>{`test('returns promise', () => {
  return fetchUser(1).then(user => {
    expect(user.name).toBe('Alice')
  })
})

// Pitfall: missing return → false positive
test('false positive — missing return (anti-pattern)', () => {
  fetchUser(1).then(user => {
    expect(user.name).toBe('wrong')   // assertion runs after test "passes"
  })
  // No return → Jest doesn't wait → test passes immediately
})`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.6.3 — async/await</Label>
        <Title>Cleanest approach</Title>
        <Code>{`test('async/await', async () => {
  const user = await fetchUser(1)
  expect(user.name).toBe('Alice')
})

// Unhandled rejection without try/catch fails the test correctly
test('async rejection propagates', async () => {
  await expect(fetchUser(-1)).rejects.toThrow('Invalid ID')
})

// expect.assertions(n) — fails if exactly N assertions didn't run
// Useful guard for conditional async paths
test('assertions count guard', async () => {
  expect.assertions(1)
  try {
    await fetchUser(-1)
  } catch (e) {
    expect((e as Error).message).toMatch('Invalid')
  }
})`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.6.4 — .resolves / .rejects matchers</Label>
        <Title>Composable async assertions</Title>
        <Note>
          These matchers unwrap the Promise before asserting. They must be <code>await</code>ed —
          without <code>await</code>, the assertion is a floating Promise and the test passes immediately.
        </Note>
        <Code>{`test('.resolves unwraps successful promise', async () => {
  await expect(fetchUser(1)).resolves.toEqual(
    expect.objectContaining({ name: 'Alice' })
  )
})

test('.rejects unwraps rejected promise', async () => {
  await expect(fetchUser(-1)).rejects.toThrow('Invalid ID')
  await expect(fetchUser(-1)).rejects.toBeInstanceOf(Error)
})

// Anti-pattern: missing await
test('false positive — no await (anti-pattern)', () => {
  // This assertion is a Promise that is never awaited
  expect(fetchUser(1)).resolves.toBe('wrong value')
  // Test passes before the assertion runs!
})`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.6.5 — expect.assertions</Label>
        <Title>Guard against silent skips</Title>
        <Code>{`test('expect.assertions guards conditional async paths', async () => {
  expect.assertions(2)    // will fail if exactly 2 assertions didn't run

  const results = await Promise.allSettled([
    fetchUser(1),
    fetchUser(-1),
  ])

  expect(results[0].status).toBe('fulfilled')
  expect(results[1].status).toBe('rejected')
})`}</Code>
      </Section>
    </div>
  )
}
