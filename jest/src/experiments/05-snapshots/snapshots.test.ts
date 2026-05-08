// ── 4.5 Snapshots ─────────────────────────────────────────────────────────────

// ── External snapshots ────────────────────────────────────────────────────────

describe('toMatchSnapshot() — external', () => {
  test('plain object snapshot', () => {
    const config = { timeout: 5000, retries: 3, debug: false, tags: ['unit', 'fast'] }
    expect(config).toMatchSnapshot()
  })

  test('array snapshot', () => {
    const items = ['alpha', 'beta', 'gamma']
    expect(items).toMatchSnapshot()
  })

  test('named snapshot', () => {
    const user = { id: 1, role: 'admin', permissions: ['read', 'write'] }
    expect(user).toMatchSnapshot('user-admin')
  })

  test('nested object snapshot', () => {
    const tree = {
      name: 'root',
      children: [
        { name: 'a', value: 1 },
        { name: 'b', value: 2, children: [{ name: 'c', value: 3 }] },
      ],
    }
    expect(tree).toMatchSnapshot()
  })
})

// ── Inline snapshots ──────────────────────────────────────────────────────────

describe('toMatchInlineSnapshot()', () => {
  test('string value', () => {
    expect('hello world').toMatchInlineSnapshot(`"hello world"`)
  })

  test('number', () => {
    expect(42).toMatchInlineSnapshot(`42`)
  })

  test('object', () => {
    expect({ name: 'Alice', score: 100 }).toMatchInlineSnapshot(`
      {
        "name": "Alice",
        "score": 100,
      }
    `)
  })

  test('error message format', () => {
    function buildError(code: string, target: string) {
      return `Error ${code}: ${target} not found`
    }
    expect(buildError('NOT_FOUND', 'user')).toMatchInlineSnapshot(
      `"Error NOT_FOUND: user not found"`
    )
  })
})

// ── Custom serializers ────────────────────────────────────────────────────────

expect.addSnapshotSerializer({
  test(val): boolean {
    return (
      val !== null &&
      typeof val === 'object' &&
      '__type' in (val as object)
    )
  },
  print(val, serialize) {
    const typed = val as { __type: string; value: unknown }
    return `<${typed.__type}>${serialize(typed.value)}</${typed.__type}>`
  },
})

describe('custom serializer', () => {
  test('formats tagged objects', () => {
    const money = { __type: 'Money', value: { amount: 100, currency: 'USD' } }
    expect(money).toMatchSnapshot()
  })

  test('nested tagged values', () => {
    const response = {
      __type: 'ApiResponse',
      value: { status: 200, data: [1, 2, 3] },
    }
    expect(response).toMatchSnapshot()
  })
})

// ── Snapshot hygiene patterns ─────────────────────────────────────────────────

describe('snapshot with dynamic values — replace before snapping', () => {
  test('replace timestamps and IDs before snapshot', () => {
    const apiResponse = {
      id: Math.floor(Math.random() * 1000),
      name: 'Alice',
      createdAt: new Date().toISOString(),
      score: 42,
    }

    // Replace dynamic fields so snapshot is stable
    const stable = {
      ...apiResponse,
      id: '[ID]',
      createdAt: '[DATE]',
    }

    expect(stable).toMatchInlineSnapshot(`
      {
        "createdAt": "[DATE]",
        "id": "[ID]",
        "name": "Alice",
        "score": 42,
      }
    `)
  })
})

// ── toMatchObject vs snapshot ─────────────────────────────────────────────────

describe('when NOT to use snapshots', () => {
  test('prefer toMatchObject for targeted assertions', () => {
    const response = { id: 1, name: 'Alice', role: 'admin', createdAt: Date.now() }

    // Better than a snapshot for this case:
    expect(response).toMatchObject({ name: 'Alice', role: 'admin' })
    expect(response.id).toEqual(expect.any(Number))
  })
})
