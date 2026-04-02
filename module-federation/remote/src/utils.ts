// Non-component module exposed via federation.
// Demonstrates that MF can share plain TS modules, not just React components.
export function formatCount(n: number): string {
  return `Count is: ${n}`
}
