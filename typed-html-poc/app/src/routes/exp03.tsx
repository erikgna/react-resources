// exp03 — Conditional Rendering
// Key question: does {false} render as string "false" or empty?
// Source: contentsToString just calls .map().join() — no boolean check
// So: false.toString() = "false" — IT RENDERS AS TEXT
// Correct pattern: condition ? <el/> : '' or condition && <el/> with explicit cast
import * as elements from 'typed-html'

// impl_1 — ternary operator (safe)
function impl1(show: boolean): string {
  return (
    <div>
      {show ? <p>Visible content</p> : ''}
    </div>
  )
}

// impl_2 — && operator: WARNING — boolean false leaks as "false" text
// This is the footgun: {false && <p>...</p>} renders "false" in HTML
function impl2(show: boolean): string {
  const warning = !show ? ' ← WARNING: "false" string rendered here' : ''
  return (
    <div>
      <p>The && operator danger:{warning}</p>
      {(show && <p>Conditional content</p>) as string}
    </div>
  )
}

// impl_3 — safe && using explicit empty string fallback
function impl3(show: boolean): string {
  return (
    <div>
      {show ? <strong>Safe conditional</strong> : ''}
      {!show ? <em>Alternate content</em> : ''}
    </div>
  )
}

// impl_4 — undefined child behavior
function impl4(): string {
  const maybeValue: string | undefined = undefined
  return (
    <div>
      Value: {maybeValue as unknown as string}
    </div>
  )
}

// impl_5 — null child behavior
function impl5(): string {
  const maybeNull: string | null = null
  return (
    <div>
      Null: {maybeNull as unknown as string}
    </div>
  )
}

// impl_6 — nested conditions
function impl6(show: boolean): string {
  const level = show ? 'admin' : 'guest'
  return (
    <nav>
      <a href="/">Home</a>
      {level === 'admin' ? <a href="/admin">Admin</a> : ''}
      {level === 'guest' ? <a href="/login">Login</a> : ''}
    </nav>
  )
}

// impl_7 — multiple conditions via helper function
function renderIf(cond: boolean, content: string): string {
  return cond ? content : ''
}

function impl7(show: boolean): string {
  return (
    <div>
      {renderIf(show, <p>Helper-based conditional</p>)}
      {renderIf(!show, <p>Alternative via helper</p>)}
    </div>
  )
}

// impl_8 — switch-style conditional
function impl8(state: 'loading' | 'error' | 'success'): string {
  const content = {
    loading: <p>Loading...</p>,
    error: <p>Error occurred</p>,
    success: <p>Data loaded</p>,
  }[state]
  return <div>{content}</div>
}

// impl_9 — conditional attribute (show/hide via hidden attr)
function impl9(show: boolean): string {
  return (
    <div hidden={!show}>
      Hidden via attribute when show=false
    </div>
  )
}

// impl_10 — clean pattern: always return string, never rely on boolean coercion
function impl10(show: boolean): string {
  const panel = show
    ? <aside><p>Panel content</p></aside>
    : ''
  return (
    <main>
      <h2>Conditional panel</h2>
      {panel}
    </main>
  )
}

export function exp03(show: boolean): string {
  return (
    <html lang="en">
      <head><title>exp03 — Conditional Rendering</title></head>
      <body>
        <h1>exp03 — Conditional Rendering (show={String(show)})</h1>
        <p><strong>FOOTGUN:</strong> typed-html renders boolean false as string "false". Always use ternary with '' fallback.</p>

        <section>
          <h2>impl_1: Ternary (safe)</h2>
          {impl1(show)}
        </section>
        <section>
          <h2>impl_2: && operator DANGER</h2>
          {impl2(show)}
        </section>
        <section>
          <h2>impl_3: Safe && with empty string fallback</h2>
          {impl3(show)}
        </section>
        <section>
          <h2>impl_4: undefined child</h2>
          {impl4()}
          <pre>undefined → renders "" (empty) — Array.join coerces undefined to ''</pre>
        </section>
        <section>
          <h2>impl_5: null child</h2>
          {impl5()}
          <pre>null → renders "" (empty) — Array.join coerces null to ''</pre>
        </section>
        <section>
          <h2>impl_6: Nested conditions</h2>
          {impl6(show)}
        </section>
        <section>
          <h2>impl_7: renderIf helper</h2>
          {impl7(show)}
        </section>
        <section>
          <h2>impl_8: Switch-style (object lookup)</h2>
          {impl8('success')}
        </section>
        <section>
          <h2>impl_9: hidden attribute</h2>
          {impl9(show)}
        </section>
        <section>
          <h2>impl_10: Clean pattern</h2>
          {impl10(show)}
        </section>
      </body>
    </html>
  )
}
