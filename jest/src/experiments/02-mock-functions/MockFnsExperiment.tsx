import { PageTitle, Subtitle, Section, Label, Title, Code, Note, Divider } from '../shared'

export default function MockFnsExperiment() {
  return (
    <div>
      <PageTitle>Mock Functions</PageTitle>
      <Subtitle>jest.fn(), jest.spyOn(), mock call inspection, and reset strategies.</Subtitle>

      <Section>
        <Label>4.2.1 — jest.fn()</Label>
        <Title>Creating mock functions</Title>
        <Note>
          A mock function records every call in <code>.mock.calls</code> and every return value in <code>.mock.results</code>.
          These arrays grow without bound unless you call <code>mockClear()</code>.
        </Note>
        <Code>{`const add = jest.fn((a: number, b: number) => a + b)

add(1, 2)
add(3, 4)

add.mock.calls    // [[1, 2], [3, 4]]
add.mock.results  // [{ type: 'return', value: 3 }, { type: 'return', value: 7 }]
add.mock.instances // [] (only populated when called with 'new')

expect(add).toHaveBeenCalledTimes(2)
expect(add).toHaveBeenCalledWith(1, 2)
expect(add).toHaveBeenLastCalledWith(3, 4)`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.2.2 — Return value control</Label>
        <Title>mockReturnValue / mockImplementation / mockImplementationOnce</Title>
        <Code>{`const fetchData = jest.fn()

// Single fixed return value
fetchData.mockReturnValue({ status: 200, data: [] })

// Resolved promise
fetchData.mockResolvedValue({ status: 200, data: [] })
fetchData.mockRejectedValue(new Error('Network error'))

// Full implementation override
fetchData.mockImplementation((id: number) => ({ id, name: 'Alice' }))

// One-shot override — pops from queue per call
fetchData
  .mockImplementationOnce(() => ({ status: 200, data: ['first'] }))
  .mockImplementationOnce(() => ({ status: 200, data: ['second'] }))
  .mockImplementation(() => ({ status: 200, data: [] }))  // fallback`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.2.3 — jest.spyOn()</Label>
        <Title>Spy on existing methods</Title>
        <Note>
          <code>spyOn</code> wraps an existing method so you can observe calls without replacing behavior.
          Pass <code>.mockImplementation()</code> after to override. Always <code>.mockRestore()</code> in afterEach.
        </Note>
        <Code>{`const obj = {
  greet(name: string) { return \`Hello, \${name}\` }
}

// Spy — still calls the real implementation
const spy = jest.spyOn(obj, 'greet')
obj.greet('Alice')

expect(spy).toHaveBeenCalledWith('Alice')
expect(spy).toHaveReturnedWith('Hello, Alice')

// Override the implementation
spy.mockImplementation(() => 'Mocked!')
obj.greet('Bob')  // returns 'Mocked!'

// Restore original after test
spy.mockRestore()
obj.greet('Charlie')  // returns 'Hello, Charlie' again`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.2.4 — Reset strategies</Label>
        <Title>mockClear vs mockReset vs mockRestore</Title>
        <Note>
          Three levels of cleanup. Using the wrong one is a common source of test pollution.
        </Note>
        <Code>{`const mock = jest.fn().mockReturnValue(42)
mock()

// mockClear() — resets call history only
// .mock.calls = [], .mock.results = []
// mockReturnValue(42) still active
mock.mockClear()

// mockReset() — resets call history + removes all return/implementation config
// .mock.calls = [], .mock.results = []
// Now returns undefined
mock.mockReset()

// mockRestore() — only for spies (jest.spyOn)
// Restores the original implementation AND clears history
// On a jest.fn(), this is a no-op
spy.mockRestore()

// In practice: put in afterEach
afterEach(() => {
  jest.clearAllMocks()   // clears all mocks' call history
  jest.resetAllMocks()   // resets all mocks
  jest.restoreAllMocks() // restores all spies
})`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>Source Reading</Label>
        <Title>Where to look</Title>
        <Code>{`node_modules/jest-mock/build/
  index.js    ← ModuleMocker, fn(), spyOn()
               Look for _mockState, _mockConfigRegistry
               The _isMockFunction flag that jest.isMockFunction() checks`}</Code>
      </Section>
    </div>
  )
}
