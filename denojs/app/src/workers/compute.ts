function fibonacci(n: number): number {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  return b;
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

function sumPrimes(n: number): number {
  let sum = 0;
  for (let i = 2; i <= n; i++) {
    if (isPrime(i)) sum += i;
  }
  return sum;
}

self.onmessage = (e: MessageEvent) => {
  const { type, n } = e.data as { type: string; n: number };
  const start = performance.now();
  let result: number;

  switch (type) {
    case "fibonacci":
      result = fibonacci(n);
      break;
    case "isPrime":
      result = isPrime(n) ? 1 : 0;
      break;
    case "sumPrimes":
      result = sumPrimes(n);
      break;
    default:
      result = -1;
  }

  self.postMessage({ result, durationMs: performance.now() - start });
};
