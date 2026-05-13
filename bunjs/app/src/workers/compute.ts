self.onmessage = (e: MessageEvent) => {
  const { type, n } = e.data as { type: string; n: number }

  if (type === "fibonacci") {
    self.postMessage({ result: fibonacci(n), type })
    return
  }

  if (type === "isPrime") {
    self.postMessage({ result: isPrime(n), type })
    return
  }

  if (type === "sumPrimes") {
    // Sum all primes up to n — deliberately CPU-intensive
    let sum = 0
    for (let i = 2; i <= n; i++) {
      if (isPrime(i)) sum += i
    }
    self.postMessage({ result: sum, type })
    return
  }

  self.postMessage({ error: `unknown type: ${type}` })
}

function fibonacci(n: number): number {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

function isPrime(n: number): boolean {
  if (n < 2) return false
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false
  }
  return true
}
