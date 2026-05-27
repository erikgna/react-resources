// exp06 — Layout Composition
// Pattern: shell templates, slot injection, head meta, nav, footer
// Key: composition is just function calls — no context, no magic
import * as elements from 'typed-html'
import type { CustomElementHandler } from 'typed-html'

// Base layout: CustomElementHandler with title + children slot
const PageLayout: CustomElementHandler = (attrs, contents) => {
  const title = attrs['title'] as string
  const description = attrs['description'] as string | undefined
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {description ? <meta name="description" content={description} /> : ''}
        <title>{title} | typed-html POC</title>
      </head>
      <body>
        <nav>
          <a href="/">Home</a>
          {' | '}
          <a href="/exp06">exp06</a>
        </nav>
        <main>
          {contents.join('\n')}
        </main>
        <footer>
          <p>typed-html POC — pure string HTML</p>
        </footer>
      </body>
    </html>
  )
}

// impl_1 — basic layout usage
function impl1(): string {
  return (
    <PageLayout title="Basic Page">
      <h1>Page Heading</h1>
      <p>Content injected into layout slot</p>
    </PageLayout>
  )
}

// impl_2 — layout with description meta
function impl2(): string {
  return (
    <PageLayout title="With Meta" description="SEO description here">
      <article>
        <h1>Article</h1>
        <p>Layout has meta description injected into head</p>
      </article>
    </PageLayout>
  )
}

// impl_3 — two-column layout
const TwoColumn: CustomElementHandler = (_attrs, contents) => {
  const [sidebar, main] = contents
  return (
    <div class="two-col">
      <aside class="sidebar">{sidebar ?? ''}</aside>
      <section class="content">{main ?? ''}</section>
    </div>
  )
}

function impl3(): string {
  return (
    <PageLayout title="Two Column">
      <TwoColumn>
        {'<nav><ul><li>Link 1</li><li>Link 2</li></ul></nav>'}
        {'<article><h2>Main Content</h2><p>Body text here</p></article>'}
      </TwoColumn>
    </PageLayout>
  )
}

// impl_4 — card grid layout
const CardGrid: CustomElementHandler = (_attrs, contents) => (
  <div class="grid">
    {contents.map(card => <div class="grid-item">{card}</div>)}
  </div>
)

const SimpleCard: CustomElementHandler = (attrs, contents) => (
  <div class="card">
    <h3>{attrs['title'] as string}</h3>
    <p>{contents.join('')}</p>
  </div>
)

function impl4(): string {
  return (
    <CardGrid>
      <SimpleCard title="Card 1">First card content</SimpleCard>
      <SimpleCard title="Card 2">Second card content</SimpleCard>
      <SimpleCard title="Card 3">Third card content</SimpleCard>
    </CardGrid>
  )
}

// impl_5 — breadcrumb as plain function (not CustomElementHandler)
interface Crumb { label: string; href: string }

function Breadcrumbs(crumbs: Crumb[]): string {
  return (
    <nav aria-label="breadcrumb">
      <ol>
        {crumbs.map((c, i) =>
          i === crumbs.length - 1
            ? <li aria-current="page">{c.label}</li>
            : <li><a href={c.href}>{c.label}</a></li>
        )}
      </ol>
    </nav>
  )
}

function impl5(): string {
  return (
    <PageLayout title="With Breadcrumbs">
      {Breadcrumbs([
        { label: 'Home', href: '/' },
        { label: 'POCs', href: '/pocs' },
        { label: 'exp06', href: '/exp06' },
      ])}
      <h1>Page with Breadcrumbs</h1>
    </PageLayout>
  )
}

// impl_6 — error page layout
const ErrorLayout: CustomElementHandler = (attrs) => {
  const code = attrs['code'] as number
  const message = attrs['message'] as string
  return (
    <html lang="en">
      <head><title>Error {String(code)}</title></head>
      <body>
        <div class="error-page">
          <h1>{String(code)}</h1>
          <p>{message}</p>
          <a href="/">Back home</a>
        </div>
      </body>
    </html>
  )
}

function impl6(): string {
  return <ErrorLayout code={404} message="Page not found" />
}

// impl_7 — partial templates as functions (most composable pattern)
function Head(title: string, extraMeta?: string): string {
  return (
    <head>
      <meta charset="UTF-8" />
      <title>{title}</title>
      {extraMeta ?? ''}
    </head>
  )
}

function Navbar(links: Array<{ href: string; label: string }>): string {
  return (
    <nav>
      {links.map(l => <a href={l.href}>{l.label}</a>)}
    </nav>
  )
}

function impl7(): string {
  return (
    <html lang="en">
      {Head('Partial Templates')}
      <body>
        {Navbar([
          { href: '/', label: 'Home' },
          { href: '/about', label: 'About' },
        ])}
        <main><p>Composing partials as plain functions</p></main>
      </body>
    </html>
  )
}

// impl_8 — role-based conditional nav
function impl8(isAdmin: boolean): string {
  return (
    <PageLayout title="Role-based Nav">
      <nav>
        <a href="/">Home</a>
        {isAdmin ? <a href="/admin">Admin</a> : ''}
        {isAdmin ? <a href="/users">Users</a> : ''}
      </nav>
      <p>isAdmin: {String(isAdmin)}</p>
    </PageLayout>
  )
}

// impl_9 — pre-rendered constant sections
const heroSection = (
  <section class="hero">
    <h1>Welcome</h1>
    <p>Hero pre-rendered as module-level constant</p>
  </section>
)

function impl9(): string {
  return (
    <PageLayout title="With Hero">
      {heroSection}
      <section class="content">
        <p>Additional content below hero</p>
      </section>
    </PageLayout>
  )
}

// impl_10 — clean: composable layout as pure function
function page(title: string, body: string): string {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>{title}</title>
      </head>
      <body>
        <header><h1>{title}</h1></header>
        <main>{body}</main>
        <footer><p>typed-html — zero runtime</p></footer>
      </body>
    </html>
  )
}

function impl10(): string {
  const body = (
    <div>
      <p>Content passed as string argument.</p>
      <p>No JSX context threading — just function calls returning strings.</p>
    </div>
  )
  return page('impl_10: Clean Layout', body)
}

export function exp06(): string {
  return impl10()
}
