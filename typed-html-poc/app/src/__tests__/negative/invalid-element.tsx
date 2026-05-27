// This file SHOULD FAIL TypeScript compilation.
// Expected error: Property 'fakeelement' does not exist on type 'IntrinsicElements'
// Error code: TS2322 or TS2339
// Run: bunx tsc --noEmit src/__tests__/negative/invalid-element.tsx 2>&1
import * as elements from 'typed-html'

const bad = <fakeelement>content</fakeelement>
