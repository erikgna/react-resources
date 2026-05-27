# typed-html POC — Knowledge Index

## What is typed-html

TypeScript JSX → HTML string at render time. Zero runtime dependencies. No VDOM. No client JS.

Install: `typed-html 3.0.1`  
Config: `tsconfig.json` with `jsxFactory: "elements.createElement"`  
Author: Nico Jansen — uses Stryker mutation testing internally

---

## Internal Architecture (read from source, not docs)

### `createElement(name, attrs, ...contents)`

```
name: string   → builds HTML element
name: function → calls CustomElementHandler(attrs, contents)
```

**Call path:**
```
createElement(name, attrs, ...contents)
  ├── if function: name({children, ...attrs}, contents)
  └── if string:
        tagName = toKebabCase(name)
        attrStr = attributesToString(attrs)
        ├── for each key: toKebabCase(key) → '${key}="${value}"'
        ├── boolean true → key only, false → '' (filtered out)
        ├── Date → .toISOString()
        └── any else → escapeAttrNodeValue(val.toString())
        
        isVoidElement(tagName)?
        ├── YES: return '<${tagName}${attrStr}>'
        └── NO:  return '<${tagName}${attrStr}>${contentsToString(contents)}</${tagName}>'

contentsToString(contents):
  → contents.map(e => Array.isArray(e) ? e.join('\n') : e).join('\n')
```

### `escapeAttrNodeValue`

Escapes ATTRIBUTE VALUES ONLY:
- `&` → `&amp;`
- `"` → `&quot;`
- ` ` (nbsp) → `&nbsp;`
- **Does NOT escape `<` or `>`**

**TEXT CONTENT: NOT ESCAPED AT ALL.**

### `toKebabCase`

Converts camelCase to kebab-case:
- `tabIndex` → `tab-index`
- `dataTestId` → `data-test-id`
- `dateTime` → `date-time`

Applies to: custom component `Attributes` (index signature keys), and raw `createElement` tag names.  
Does NOT apply to: JSX intrinsic element attribute names (those are typed by HTML-spec types).

---

## Critical Findings

### 1. HTML-spec attr names, NOT React camelCase

This is the biggest footgun for React developers:

| React JSX | typed-html JSX |
|-----------|---------------|
| `className` | `class` |
| `htmlFor` | `for` |
| `tabIndex` | `tabindex` |
| `dateTime` | `datetime` |
| `autoComplete` | `autocomplete` |
| `maxLength` | `maxlength` |
| `readOnly` | `readonly` |

typed-html is HTML-faithful. React is JS-friendly. Different philosophies.

### 2. Empty attrs `{}` adds trailing space

```typescript
createElement('br', {}) → '<br >'   // NOT '<br>'
createElement('div', {}) → '<div ></div>'
```

`attributesToString({})` returns `' '` (space) because it always prepends `' '` before the key list, even when the list is empty.

Pass `null` instead of `{}` to avoid the space:
```typescript
createElement('br', null as any) → '<br>'
```

In JSX this is transparent because TypeScript handles it.

### 3. Boolean children footgun

```typescript
// DANGEROUS: false renders as "false" string
{condition && <p>Content</p>}  // when false → renders "false"

// SAFE: always use ternary
{condition ? <p>Content</p> : ''}
```

Why: `[false].join('\n')` = `'false'` (Array.join coerces booleans to strings)

But: `null` and `undefined` children render as empty string — `[null].join()` = `''`

### 4. XSS: Asymmetric escaping

| Context | Escaped by typed-html? | Remediation |
|---------|----------------------|-------------|
| Text content `{userInput}` | NO | `Bun.escapeHTML(userInput)` |
| Attribute value `title={x}` | Partial (& and " only) | `Bun.escapeHTML(x)` for untrusted |
| Attribute `<` and `>` | NO | Always escape untrusted URLs |

```typescript
// WRONG
<p>{userInput}</p>

// CORRECT
<p>{Bun.escapeHTML(userInput)}</p>
```

### 5. hono/jsx vs typed-html: collision risk

Hono ships its own JSX engine (`hono/jsx`). If you import it alongside typed-html:
- Two `jsxFactory` definitions compete
- TypeScript may use one while runtime uses another
- Result: silent type checking failure or wrong output

**Rule**: Never `import { jsx } from 'hono/jsx'` in a typed-html project.
**tsconfig.json** must have `jsxFactory: "elements.createElement"` and `jsx: "react"`.

### 6. string[] attribute → comma-separated (not space-separated)

```typescript
<button class={['btn', 'primary']}> → class="btn,primary"  // WRONG for CSS
<button class={['btn', 'primary'].join(' ')}> → class="btn primary"  // CORRECT
```

### 7. Custom component camelCase → kebab transform DOES work

```typescript
// Custom components use Attributes: { [key: string]: AttributeValue }
// toKebabCase applies to all Attributes keys
<MyComp dataTestId="x" /> → attrs = { 'data-test-id': 'x' }
```

This is the correct use case for camelCase: your own component props.

---

## Performance Results (10,000 renders, Bun 1.3.11)

| Renderer | Throughput | Avg ns/render |
|----------|-----------|---------------|
| typed-html JSX | 934,288/sec | 1,070 ns |
| Template literal | 10,890,280/sec | 92 ns |
| Overhead | 11.66x slower | — |

**Conclusion**: typed-html is 11.66x slower than raw template literals. At ~934K renders/sec, it's fast enough for any web server serving HTML (typical request rates are thousands per second, not millions). The overhead is from `toKebabCase`, attribute serialization, and function call overhead per element.

---

## TypeScript Compile-time Enforcement

### Invalid element name

```typescript
<fakeelement>content</fakeelement>
// error TS2339: Property 'fakeelement' does not exist on type 'JSX.IntrinsicElements'
```

### Invalid attribute on known element

```typescript
<div unknownProp="x">content</div>
// error TS2322: Object literal may only specify known properties;
//              'unknownProp' does not exist in type 'HtmlTag'
```

TypeScript catches these before runtime. This is the core value proposition.

---

## Type System Summary

```typescript
// Exported types
type AttributeValue = number | string | Date | boolean | string[]
interface Attributes { [key: string]: AttributeValue }
interface Children { children?: AttributeValue }
interface CustomElementHandler {
  (attributes: Attributes & Children, contents: string[]): string
}

// JSX types (intrinsic elements)
// Each HTML element has a typed interface: HtmlTag, HtmlInputTag, etc.
// These use HTML-spec lowercase attr names
```

---

## Patterns That Work

### Clean layout composition

```typescript
function page(title: string, body: string): string {
  return (
    <html lang="en">
      <head><title>{title}</title></head>
      <body>{body}</body>
    </html>
  )
}

const html = page('My Page', <main><p>Content</p></main>)
```

### Typed custom component

```typescript
type CardProps = { title: string; body: string }

const Card: CustomElementHandler = (rawAttrs, _contents) => {
  const { title, body } = rawAttrs as CardProps
  return <div class="card"><h3>{title}</h3><p>{body}</p></div>
}

// Usage:
<Card title="Hello" body="World" />
```

### Safe user input

```typescript
const safe = Bun.escapeHTML(userInput)
return <p>{safe}</p>
```

### Conditional rendering (safe)

```typescript
// Always return string, never rely on boolean coercion
const content = show ? <p>Visible</p> : ''
return <div>{content}</div>
```

---

## Comparison: typed-html vs hono/jsx vs template literals

| Feature | typed-html | hono/jsx | Template literal |
|---------|-----------|----------|-----------------|
| Type safety | ✓ element + attr | ✓ partial | ✗ none |
| JSX syntax | ✓ | ✓ | ✗ |
| Async JSX | ✗ | ✓ | N/A |
| Streaming | ✗ | ✓ | manual |
| Performance | 934K/sec | ~similar | 10M/sec |
| Hono coupling | ✗ | ✓ required | ✗ |
| Content escaping | ✗ caller | ✗ caller | ✗ caller |
| Attr name style | HTML-spec | React-ish | none |

---

## Running

```bash
cd typed-html-poc/app
bun run dev          # port 3002, hot reload
bun test             # tests, all pass
bash compile-errors.sh  # negative type tests
```

Routes: `/exp01` through `/exp10`, index at `/`

---

## Conclusion

### What was proven

- typed-html produces correct HTML strings via JSX with zero runtime dependencies
- TypeScript catches invalid elements and attributes at compile time — core value proposition holds
- Throughput at ~934K renders/sec is sufficient for any server-side HTML use case
- XSS surface is asymmetric and caller-owned: text content unescaped, attribute values partially escaped
- `Bun.escapeHTML()` is adequate remediation for content XSS in a Bun runtime context
- Boolean children footgun (`{false && ...}` → renders `"false"`) is a real gotcha for React developers

### What was disproven / not fit for purpose

- async JSX is not supported — no `await` inside JSX expressions; hono/jsx is required if you need this
- Streaming responses require manual chunking — no built-in support
- Class arrays do not work as expected — `.join(' ')` required before passing to `class=`
- `hono/jsx` cannot coexist with typed-html in the same file — competing `jsxFactory` configs

### Go/no-go recommendation

**Go** for: server-rendered HTML pages where type safety on HTML output is valuable, no client JS required, and XSS surface is controlled (internal tools, admin panels, email templates).

**No-go** for: apps requiring async data fetching inside components, streaming HTML, or React ecosystem reuse. Use hono/jsx if staying in Hono. Use template literals if raw performance is the constraint.

### Decision rationale

typed-html wins over template literals on correctness (TS compile-time enforcement). It loses on async and streaming. It wins over hono/jsx on zero Hono coupling and explicit HTML-spec attribute semantics. The 11.66x performance gap vs template literals is irrelevant at web-server scale but matters in tight loops.
