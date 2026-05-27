// exp02 — Attribute Serialization
// KEY FINDING: typed-html intrinsic elements use HTML-spec attr names, NOT React camelCase
//   class (not className), for (not htmlFor), tabindex (not tabIndex), datetime (not dateTime)
//   This differs from React! typed-html is HTML-faithful, React is JS-friendly
//
// camelCase → kebab conversion IS in the source (toKebabCase) but applies to:
//   - Custom component Attributes interface (index signature): dataTestId → data-test-id
//   - NOT to intrinsic element JSX (TypeScript enforces the typed-html HTML attrs)
//
// Attribute VALUE escaping (escapeAttrNodeValue): & → &amp;, " → &quot;,   → &nbsp;
// Boolean: true → name only, false → omitted
import * as elements from 'typed-html'

// impl_1 — boolean attributes (disabled: string | boolean, checked: string | boolean)
function impl1(): string {
  return (
    <div>
      <input type="checkbox" checked={true} disabled={false} />
      <p>checked=true → "checked" attr, disabled=false → omitted</p>
    </div>
  )
}

// impl_2 — HTML-spec attr names (not React camelCase)
function impl2(): string {
  return (
    <div>
      <label for="x">for= (not htmlFor=)</label>
      <input id="x" tabindex="1" autocomplete="off" />
      <p>typed-html uses HTML attribute names directly</p>
    </div>
  )
}

// impl_3 — class (not className)
function impl3(): string {
  return (
    <div class="container primary" id="main">
      class= (not className=) — typed-html is HTML-faithful
    </div>
  )
}

// impl_4 — camelCase on custom components → kebab-case (toKebabCase runs)
// This IS the runtime conversion — but only for custom component attrs
function impl4(): string {
  const CustomEl = (attrs: Record<string, unknown>, contents: string[]) =>
    `<custom data-test-id="${attrs['dataTestId']}" data-user-id="${attrs['dataUserId']}">${contents.join('')}</custom>`

  return elements.createElement(CustomEl as never, { dataTestId: 'my-div', dataUserId: '42' }, 'content')
}

// impl_5 — attribute value escaping: & and "
function impl5(): string {
  const dangerousAttr = 'AT&T "Wireless"'
  return (
    <a href="/x" title={dangerousAttr}>
      Attribute value escaped: & → &amp;amp; and " → &amp;quot;
    </a>
  )
}

// impl_6 — numeric attributes: typed-html expects strings for most attrs
function impl6(): string {
  // maxlength, min, max, step take string (typed as string in HtmlInputTag)
  return (
    <input type="range" min="0" max="100" step="5" value="50" />
  )
}

// impl_7 — datetime attribute (Date | string accepted by HtmlTimeTag)
function impl7(): string {
  const now = new Date('2026-05-26T00:00:00Z')
  return (
    <time datetime={now}>
      Date object → ISO 8601 via .toISOString()
    </time>
  )
}

// impl_8 — string array attr: toString → comma-separated (FOOTGUN for class)
function impl8(): string {
  // Don't do this for class! Use .join(' ') first
  const classes: string[] = ['btn', 'btn-primary', 'large']
  return (
    <div>
      <p>Wrong: class as array (gets comma-joined)</p>
      <button type="button" class={classes as unknown as string}>
        classes array toString: btn,btn-primary,large
      </button>
      <p>Correct: join with space first</p>
      <button type="button" class={classes.join(' ')}>
        classes.join space: btn btn-primary large
      </button>
    </div>
  )
}

// impl_9 — children key filtered from attributes
function impl9(): string {
  return elements.createElement('div', { id: 'test', children: 'ignored' as never }, 'actual children')
}

// impl_10 — comprehensive: correct HTML-spec attr usage
function impl10(): string {
  return (
    <form method="post" action="/exp07" autocomplete="off">
      <label for="final">Label (for=, not htmlFor=)</label>
      <input
        id="final"
        type="email"
        class="form-input"
        disabled={false}
        required="required"
        maxlength="255"
        tabindex="0"
        placeholder="HTML spec attrs, not React camelCase"
      />
      <button type="submit" class="btn">Submit</button>
    </form>
  )
}

export function exp02(): string {
  return (
    <html lang="en">
      <head><title>exp02 — Attribute Serialization</title></head>
      <body>
        <h1>exp02 — Attribute Serialization</h1>
        <p><strong>CRITICAL:</strong> typed-html uses HTML-spec attr names (class, for, tabindex, datetime) — NOT React camelCase (className, htmlFor, tabIndex, dateTime)</p>
        <p>camelCase → kebab conversion applies to <em>custom component</em> attrs only (Attributes index signature), not to typed intrinsic elements</p>

        <section><h2>impl_1: Boolean attributes</h2>{impl1()}</section>
        <section><h2>impl_2: HTML-spec attr names</h2>{impl2()}</section>
        <section><h2>impl_3: class= not className=</h2>{impl3()}</section>
        <section>
          <h2>impl_4: camelCase on custom component attrs → kebab</h2>
          {impl4()}
          <pre>dataTestId → data-test-id (via toKebabCase on Attributes index signature)</pre>
        </section>
        <section><h2>impl_5: Value escaping</h2>{impl5()}</section>
        <section><h2>impl_6: String attrs (no numbers)</h2>{impl6()}</section>
        <section><h2>impl_7: datetime accepts Date</h2>{impl7()}</section>
        <section><h2>impl_8: array[] attr footgun</h2>{impl8()}</section>
        <section><h2>impl_9: children filtered</h2>{impl9()}</section>
        <section><h2>impl_10: Correct HTML-spec attrs</h2>{impl10()}</section>
      </body>
    </html>
  )
}
