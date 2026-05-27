// This file SHOULD FAIL TypeScript compilation.
// Expected error: Object literal may only specify known properties
// Testing: typed-html rejects attributes not in its type definitions
// Run: bunx tsc --noEmit to see the error
import * as elements from 'typed-html'

const bad = <div unknownProp="test">content</div>
