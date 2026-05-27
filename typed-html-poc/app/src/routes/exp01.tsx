// exp01 — Basic Elements
// Trace: createElement(tag, attrs, ...children) → string
// Internal: toKebabCase(name) + attributesToString + contentsToString + void element check
// KEY FINDING: typed-html uses HTML-spec attr names (class, for, tabindex) NOT React camelCase
import * as elements from 'typed-html'

// impl_1 — basic nesting
function impl1(): string {
  return (
    <div>
      <h1>Hello typed-html</h1>
      <p>Basic element rendering</p>
      <br />
      <span>inline element</span>
    </div>
  )
}

// impl_2 — void elements have no closing tag
function impl2(): string {
  return (
    <section>
      <h2>Void elements</h2>
      <hr />
      <img src="/placeholder.png" alt="placeholder" />
      <input type="text" />
    </section>
  )
}

// impl_3 — nesting produces recursive string concat
function impl3(): string {
  return (
    <article>
      <header>
        <h3>Nested</h3>
      </header>
      <main>
        <p>Inner content</p>
      </main>
      <footer>
        <small>Footer</small>
      </footer>
    </article>
  )
}

// impl_4 — elements.createElement called directly (no JSX)
function impl4(): string {
  return elements.createElement('div', {},
    elements.createElement('p', {}, 'Direct createElement call'),
    elements.createElement('em', {}, 'no JSX syntax')
  )
}

// impl_5 — text nodes are strings in children
function impl5(): string {
  return (
    <p>
      Text before {'interpolated string'} text after
    </p>
  )
}

// impl_6 — numbers as children (coerced to string via .toString())
function impl6(): string {
  const count = 42
  const pi = 3.14159
  return (
    <div>
      <p>Count: {String(count)}</p>
      <p>Pi: {String(pi)}</p>
    </div>
  )
}

// impl_7 — list items
function impl7(): string {
  return (
    <ul>
      <li>Item A</li>
      <li>Item B</li>
      <li>Item C</li>
    </ul>
  )
}

// impl_8 — 5 levels deep (no stack overflow at this depth)
function impl8(): string {
  return (
    <div>
      <div>
        <div>
          <div>
            <div>5 levels deep</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// impl_9 — form elements with HTML-spec attrs (for=, not htmlFor=)
function impl9(): string {
  return (
    <form>
      <label for="field">Label</label>
      <input id="field" type="email" />
      <button type="submit">Submit</button>
    </form>
  )
}

// impl_10 — clean, demonstrates understanding
function impl10(): string {
  return (
    <main>
      <h1>impl_10 — Final understanding</h1>
      <p>createElement(tag, attrs?, ...children) returns string directly.</p>
      <p>Void elements: self-closing, no children joined.</p>
      <p>Children: joined with newline via contentsToString.</p>
      <hr />
      <code>{'<div> → string, no VDOM, no diffing'}</code>
    </main>
  )
}

export function exp01(): string {
  return (
    <html lang="en">
      <head><title>exp01 — Basic Elements</title></head>
      <body>
        <h1>exp01 — Basic Elements</h1>
        <p><strong>KEY:</strong> typed-html uses HTML attr names (class, for, tabindex), NOT React camelCase</p>
        <section>
          <h2>impl_1: Basic nesting</h2>
          {impl1()}
        </section>
        <section>
          <h2>impl_2: Void elements</h2>
          {impl2()}
        </section>
        <section>
          <h2>impl_3: Deep nesting</h2>
          {impl3()}
        </section>
        <section>
          <h2>impl_4: Direct createElement (no JSX)</h2>
          {impl4()}
        </section>
        <section>
          <h2>impl_5: Text interpolation</h2>
          {impl5()}
        </section>
        <section>
          <h2>impl_6: Number children (String() cast needed)</h2>
          {impl6()}
        </section>
        <section>
          <h2>impl_7: List items</h2>
          {impl7()}
        </section>
        <section>
          <h2>impl_8: 5-level nesting</h2>
          {impl8()}
        </section>
        <section>
          <h2>impl_9: Form elements (HTML attrs)</h2>
          {impl9()}
        </section>
        <section>
          <h2>impl_10: Final understanding</h2>
          {impl10()}
        </section>
      </body>
    </html>
  )
}
