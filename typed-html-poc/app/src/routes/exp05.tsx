// exp05 — Custom Components (CustomElementHandler)
// Internal: if typeof name === 'function', call name({children, ...attributes}, contents)
// Key: attrs object merges children + all other attrs before passing to handler
// AttributeValue: number | string | Date | boolean | string[]
// Attributes interface has index signature [key: string]: AttributeValue
// camelCase props on custom components → toKebabCase conversion applies
import * as elements from 'typed-html'
import type { Attributes, Children, CustomElementHandler } from 'typed-html'

// impl_1 — simplest custom component
const Card: CustomElementHandler = (_attrs, contents) => (
  <div class="card">
    <div class="card-body">
      {contents.join('\n')}
    </div>
  </div>
)

function impl1(): string {
  return (
    <Card>
      <p>Card content here</p>
    </Card>
  )
}

// impl_2 — component with typed attrs (no optional in Attributes — use intersection trick)
type AlertAttrs = {
  type: string
  title: string
}

const Alert: CustomElementHandler = (rawAttrs, contents) => {
  const attrs = rawAttrs as AlertAttrs
  return (
    <div class={`alert alert-${attrs.type}`} role="alert">
      <strong>{attrs.title}</strong>
      {contents.join('\n')}
    </div>
  )
}

function impl2(): string {
  return (
    <Alert type="warning" title="Heads up">
      <p>Something needs your attention.</p>
    </Alert>
  )
}

// impl_3 — component with no children (self-closing)
const Badge: CustomElementHandler = (attrs) => {
  const label = attrs['label'] as string
  const variant = (attrs['variant'] as string) ?? 'default'
  return <span class={`badge badge-${variant}`}>{label}</span>
}

function impl3(): string {
  return (
    <div>
      <Badge label="New" variant="success" />
      <Badge label="Beta" variant="warning" />
    </div>
  )
}

// impl_4 — layout component (slot pattern via contents[])
const Layout: CustomElementHandler = (attrs, contents) => {
  const title = (attrs['title'] as string) ?? 'Page'
  return (
    <html lang="en">
      <head><title>{title}</title></head>
      <body>
        <header><h1>{title}</h1></header>
        <main>{contents.join('\n')}</main>
      </body>
    </html>
  )
}

function impl4(): string {
  return (
    <Layout title="My Page">
      <p>Page body content</p>
      <p>Slot pattern via contents[]</p>
    </Layout>
  )
}

// impl_5 — composing custom components
const Section: CustomElementHandler = (attrs, contents) => {
  const heading = attrs['heading'] as string
  return (
    <section>
      <h2>{heading}</h2>
      {contents.join('\n')}
    </section>
  )
}

function impl5(): string {
  return (
    <div>
      <Section heading="About">
        <p>About content</p>
      </Section>
      <Section heading="Contact">
        <p>Contact content</p>
      </Section>
    </div>
  )
}

// impl_6 — component factory (returns CustomElementHandler)
function makeButton(defaultVariant: string): CustomElementHandler {
  return (attrs, contents) => {
    const variant = (attrs['variant'] as string) ?? defaultVariant
    return <button class={`btn btn-${variant}`} type="button">{contents.join('')}</button>
  }
}

const PrimaryButton = makeButton('primary')
const DangerButton = makeButton('danger')

function impl6(): string {
  return (
    <div>
      <PrimaryButton>Save</PrimaryButton>
      <DangerButton>Delete</DangerButton>
      <PrimaryButton variant="secondary">Cancel</PrimaryButton>
    </div>
  )
}

// impl_7 — component receiving multiple children as separate items in contents[]
const List: CustomElementHandler = (_attrs, contents) => (
  <ul>
    {contents.map(item => <li>{item}</li>)}
  </ul>
)

function impl7(): string {
  return (
    <List>
      {'Apple'}
      {'Banana'}
      {'Cherry'}
    </List>
  )
}

// impl_8 — conditional render inside component
const ConditionalPanel: CustomElementHandler = (attrs, contents) => {
  const visible = attrs['visible'] as boolean
  return visible
    ? <div class="panel">{contents.join('\n')}</div>
    : ''
}

function impl8(): string {
  return (
    <div>
      <ConditionalPanel visible={true}><p>Visible panel</p></ConditionalPanel>
      <ConditionalPanel visible={false}><p>Hidden panel</p></ConditionalPanel>
    </div>
  )
}

// impl_9 — trace: what attrs actually contains when called
const DebugComponent: CustomElementHandler = (attrs, contents) => {
  // Note: attrs includes {children: ..., ...otherAttrs} when contents exist
  const attrDump = JSON.stringify({ ...attrs, children: String(attrs.children).substring(0, 50) }, null, 2)
  return (
    <div>
      <pre>{attrDump}</pre>
      <p>contents.length: {String(contents.length)}</p>
    </div>
  )
}

function impl9(): string {
  return (
    <DebugComponent id="debug-1" class="test" dataValue="42">
      child1
    </DebugComponent>
  )
}

// impl_10 — clean: typed component, no any, proper Attributes
type InputFieldProps = {
  label: string
  name: string
  type: string
  required?: boolean
}

const InputField: CustomElementHandler = (rawAttrs) => {
  const { label, name, type, required = false } = rawAttrs as InputFieldProps
  return (
    <div class="form-group">
      <label for={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        class="form-control"
      />
    </div>
  )
}

function impl10(): string {
  return (
    <form method="post">
      <InputField label="Email" name="email" type="email" required={true} />
      <InputField label="Password" name="password" type="password" required={true} />
      <InputField label="Bio" name="bio" type="text" />
    </form>
  )
}

export function exp05(): string {
  return (
    <html lang="en">
      <head><title>exp05 — Custom Components</title></head>
      <body>
        <h1>exp05 — Custom Components (CustomElementHandler)</h1>
        <p>Internal: if typeof name === 'function', called as name(&#123;children, ...attrs&#125;, contents[])</p>
        <p>Attributes uses index signature — camelCase attrs → toKebabCase applied</p>

        <section><h2>impl_1: Simple card</h2>{impl1()}</section>
        <section><h2>impl_2: Typed attrs</h2>{impl2()}</section>
        <section><h2>impl_3: Self-closing badge</h2>{impl3()}</section>
        <section><h2>impl_4: Layout slot (full document)</h2><pre>Returns full HTML — see source</pre></section>
        <section><h2>impl_5: Composed components</h2>{impl5()}</section>
        <section><h2>impl_6: Component factory</h2>{impl6()}</section>
        <section><h2>impl_7: Multiple children as contents[]</h2>{impl7()}</section>
        <section><h2>impl_8: Conditional in component</h2>{impl8()}</section>
        <section><h2>impl_9: attrs trace (dataValue → data-value in output)</h2>{impl9()}</section>
        <section><h2>impl_10: Typed InputField</h2>{impl10()}</section>
      </body>
    </html>
  )
}
