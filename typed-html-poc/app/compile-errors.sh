#!/bin/bash
# Verify typed-html rejects invalid HTML at compile time
# Expected: non-zero exit + specific TS error codes

echo "=== Negative compile tests ==="
echo ""

echo "1. Invalid element name (fakeelement):"
cd "$(dirname "$0")"
result=$(bunx tsc --noEmit --skipLibCheck --jsx react --jsxFactory "elements.createElement" \
  src/__tests__/negative/invalid-element.tsx 2>&1)
echo "$result"
if echo "$result" | grep -q "error TS"; then
  echo "✓ PASS: TypeScript correctly rejected invalid element"
else
  echo "✗ FAIL: Expected a TypeScript error"
fi

echo ""
echo "2. Invalid attribute on known element:"
result2=$(bunx tsc --noEmit --skipLibCheck --jsx react --jsxFactory "elements.createElement" \
  src/__tests__/negative/invalid-attribute.tsx 2>&1)
echo "$result2"
if echo "$result2" | grep -q "error TS"; then
  echo "✓ PASS: TypeScript correctly rejected invalid attribute"
else
  echo "✗ FAIL: Expected a TypeScript error"
fi
