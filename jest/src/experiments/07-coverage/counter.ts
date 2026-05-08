// Branch-rich module for coverage experiments

export function classify(n: number): 'positive' | 'negative' | 'zero' {
  return n > 0 ? 'positive' : n < 0 ? 'negative' : 'zero'
}

export function getLabel(value: string | null | undefined): string {
  return value ?? 'default'
}

export function processUser(user: { name?: string; role?: string } | null): string {
  return user?.name ?? 'anonymous'
}

export function isAdmin(user: { role: string } | null): boolean {
  return !!(user && user.role === 'admin')
}

export function divide(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero')
  return a / b
}

export function range(start: number, end: number): number[] {
  const result: number[] = []
  for (let i = start; i <= end; i++) result.push(i)
  return result
}

/* istanbul ignore next */
export function neverCalled(): string {
  return 'this function is excluded from coverage via pragma'
}

export function partiallyTested(flag: boolean): string {
  if (flag) {
    return 'branch A'
  } else {
    return 'branch B'   // intentionally left uncovered in coverage.test.ts
  }
}
