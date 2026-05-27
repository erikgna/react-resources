// exp10 — Mini-SSR Framework
// Build a minimal but reusable SSR layer on top of typed-html + Hono
// Demonstrates: component hierarchy, head injection, slot pattern, layout system
// Uses HTML-spec attrs throughout (class, for, datetime, tabindex)
import * as elements from 'typed-html'
import type { CustomElementHandler } from 'typed-html'

// ── Types ──────────────────────────────────────────────────────────────────

interface PageMeta {
  title: string
  description?: string
}

// ── Head function ──────────────────────────────────────────────────────────

function Head({ title, description }: PageMeta, extraHead?: string): string {
  return (
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      {description ? <meta name="description" content={description} /> : ''}
      <title>{title} | Mini SSR</title>
      {extraHead ?? ''}
    </head>
  )
}

// ── Nav function ───────────────────────────────────────────────────────────

interface NavLink { href: string; label: string; active?: boolean }

function Nav(links: NavLink[]): string {
  return (
    <nav aria-label="Main navigation">
      {links.map(l =>
        l.active
          ? <a href={l.href} aria-current="page"><strong>{l.label}</strong></a>
          : <a href={l.href}>{l.label}</a>
      )}
    </nav>
  )
}

// ── Footer function ────────────────────────────────────────────────────────

function Footer(): string {
  return (
    <footer>
      <p>typed-html Mini SSR — zero runtime, pure strings</p>
      <p>
        <a href="/">POC index</a>
      </p>
    </footer>
  )
}

// ── Shell layout ───────────────────────────────────────────────────────────

interface ShellProps extends PageMeta {
  activeHref?: string
  body: string
}

function Shell({ title, description, activeHref, body }: ShellProps): string {
  const navLinks: NavLink[] = [
    { href: '/', label: 'Home', active: activeHref === '/' },
    { href: '/exp01', label: 'Elements', active: activeHref === '/exp01' },
    { href: '/exp09', label: 'Benchmark', active: activeHref === '/exp09' },
    { href: '/exp10', label: 'Mini SSR', active: activeHref === '/exp10' },
  ]

  return (
    <html lang="en">
      {Head({ title, description })}
      <body>
        {Nav(navLinks)}
        <main id="content">
          {body}
        </main>
        {Footer()}
      </body>
    </html>
  )
}

// ── Page components ────────────────────────────────────────────────────────

interface CardData {
  title: string
  body: string
  href?: string
}

function FeatureCard({ title, body, href }: CardData): string {
  return (
    <article class="card">
      <h3>{title}</h3>
      <p>{body}</p>
      {href ? <a href={href}>Learn more →</a> : ''}
    </article>
  )
}

function HeroSection(headline: string, sub: string): string {
  return (
    <section class="hero" aria-labelledby="hero-heading">
      <h1 id="hero-heading">{headline}</h1>
      <p class="lead">{sub}</p>
    </section>
  )
}

function FeatureGrid(cards: CardData[]): string {
  return (
    <section aria-label="Features">
      <h2>What this POC proves</h2>
      <div class="grid">
        {cards.map(c => FeatureCard(c))}
      </div>
    </section>
  )
}

function StatsSection(stats: Array<{ label: string; value: string }>): string {
  return (
    <section aria-label="Stats">
      <h2>Benchmark results</h2>
      <dl>
        {stats.flatMap(s => [
          <dt>{s.label}</dt>,
          <dd>{s.value}</dd>,
        ])}
      </dl>
    </section>
  )
}

// ── Main page assembly ─────────────────────────────────────────────────────

export function exp10(): string {
  const features: CardData[] = [
    {
      title: 'Zero Runtime',
      body: 'No VDOM, no reconciliation. JSX compiles to string concatenation.',
      href: '/exp01',
    },
    {
      title: 'Type-safe HTML',
      body: 'Invalid elements and attributes fail at TypeScript compile time.',
      href: '/exp02',
    },
    {
      title: 'XSS Awareness',
      body: 'Content NOT escaped. Attribute values escaped. Caller owns safety.',
      href: '/exp08',
    },
    {
      title: 'Composable',
      body: 'CustomElementHandler enables component patterns without React.',
      href: '/exp05',
    },
  ]

  const stats = [
    { label: 'Runtime dependencies', value: '0 (zero)' },
    { label: 'Client JS payload', value: '0 bytes' },
    { label: 'JSX nodes per call', value: 'string concat, not VDOM' },
    { label: 'Render model', value: 'pure function: props → string' },
  ]

  const body = (
    <div>
      {HeroSection(
        'Mini SSR Framework',
        'typed-html + Hono + Bun — JSX to HTML string, no framework magic'
      )}
      {FeatureGrid(features)}
      {StatsSection(stats)}
      <section>
        <h2>Architecture trace</h2>
        <ol>
          <li>Bun runs index.ts (TypeScript native, no tsc step)</li>
          <li>Hono receives GET /exp10</li>
          <li>exp10() → Shell() → Head() + Nav() + body + Footer()</li>
          <li>Each function returns a string</li>
          <li>Strings concatenated by createElement via contentsToString</li>
          <li>Final string returned as HTTP response body</li>
          <li>No VDOM, no hydration, no client bundle</li>
        </ol>
      </section>
    </div>
  )

  return Shell({
    title: 'Mini SSR',
    description: 'typed-html mini SSR framework demonstration',
    activeHref: '/exp10',
    body,
  })
}
