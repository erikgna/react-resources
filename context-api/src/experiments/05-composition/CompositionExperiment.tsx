import { createContext, useContext, useState, useRef } from 'react'
import { Section, Row, Btn, Info, Pre, Box, ui } from '../shared'

// ─── Theme context ────────────────────────────────────────────────────────────

type Theme = 'dark' | 'light' | 'solarized'
const ThemeCtx = createContext<Theme>('dark')

function useTheme() { return useContext(ThemeCtx) }

const themeStyles: Record<Theme, { bg: string; text: string; accent: string }> = {
  dark:      { bg: '#111', text: '#e0e0e0', accent: '#4a9eff' },
  light:     { bg: '#f5f5f5', text: '#111', accent: '#0066cc' },
  solarized: { bg: '#002b36', text: '#839496', accent: '#268bd2' },
}

function ThemedCard({ children }: { children: React.ReactNode }) {
  const theme = useTheme()
  const s = themeStyles[theme]
  const renders = useRenderCount()
  return (
    <div style={{
      background: s.bg, color: s.text, border: `1px solid ${s.accent}`,
      borderRadius: 4, padding: '10px 14px', minWidth: 160, fontSize: 13,
    }}>
      <div style={{ fontSize: 10, color: s.accent, marginBottom: 6, textTransform: 'uppercase' }}>
        ThemedCard [r:{renders}]
      </div>
      {children}
    </div>
  )
}

// ─── Auth context ─────────────────────────────────────────────────────────────

type User = { name: string; role: 'admin' | 'viewer' | 'guest' }
const AuthCtx = createContext<User>({ name: 'guest', role: 'guest' })

function useAuth() { return useContext(AuthCtx) }

function UserBadge() {
  const user = useAuth()
  const renders = useRenderCount()
  const roleColor = user.role === 'admin' ? '#f9a825' : user.role === 'viewer' ? '#4a9eff' : '#555'
  return (
    <Box name="UserBadge" renders={renders}>
      <span>{user.name}</span>{' '}
      <span style={{ color: roleColor, fontSize: 11 }}>[{user.role}]</span>
    </Box>
  )
}

// ─── Locale context ───────────────────────────────────────────────────────────

type Locale = 'en' | 'pt' | 'ja'
const LocaleCtx = createContext<Locale>('en')

function useLocale() { return useContext(LocaleCtx) }

const labels: Record<Locale, { greeting: string; count: string; save: string }> = {
  en: { greeting: 'Hello', count: 'Count', save: 'Save' },
  pt: { greeting: 'Olá', count: 'Contagem', save: 'Salvar' },
  ja: { greeting: 'こんにちは', count: 'カウント', save: '保存' },
}

function LocalizedUI() {
  const locale = useLocale()
  const l = labels[locale]
  const renders = useRenderCount()
  return (
    <Box name="LocalizedUI" renders={renders}>
      <div>{l.greeting}!</div>
      <div style={{ fontSize: 11, color: '#666' }}>{l.count} / {l.save}</div>
    </Box>
  )
}

// ─── Multi-context consumer ───────────────────────────────────────────────────

function MultiContextConsumer() {
  const theme = useTheme()
  const user = useAuth()
  const locale = useLocale()
  const s = themeStyles[theme]
  const renders = useRenderCount()
  return (
    <div style={{
      background: s.bg, color: s.text, border: `1px solid #333`,
      borderRadius: 4, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ fontSize: 10, color: s.accent, marginBottom: 6, textTransform: 'uppercase' }}>
        MultiConsumer [r:{renders}]
      </div>
      <div>theme: {theme}</div>
      <div>user: {user.name} ({user.role})</div>
      <div>locale: {locale}</div>
    </div>
  )
}

// ─── Render counter ───────────────────────────────────────────────────────────

import React from 'react'

function useRenderCount() {
  const ref = useRef(0)
  ref.current += 1
  return ref.current
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CompositionExperiment() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [user, setUser] = useState<User>({ name: 'alice', role: 'admin' })
  const [locale, setLocale] = useState<Locale>('en')

  return (
    <div>
      <h2 style={ui.h2}>5 · Multiple Context Composition</h2>
      <p style={ui.desc}>
        Theme + Auth + Locale — three independent contexts composed via nested Providers.
        Observe which consumers re-render when each context changes independently.
      </p>

      <Section title="5.1 Three Independent Contexts">
        <Info>
          Each context is fully independent. Updating theme doesn't touch auth or locale consumers.
          Provider nesting order doesn't affect functionality — only readability convention matters.
        </Info>
        <Row style={{ marginBottom: 12 }}>
          <Btn onClick={() => setTheme(t => t === 'dark' ? 'light' : t === 'light' ? 'solarized' : 'dark')}>
            theme: {theme}
          </Btn>
          <Btn onClick={() => setUser(u => u.role === 'admin'
            ? { name: 'bob', role: 'viewer' }
            : { name: 'alice', role: 'admin' }
          )}>
            user: {user.name}
          </Btn>
          <Btn onClick={() => setLocale(l => l === 'en' ? 'pt' : l === 'pt' ? 'ja' : 'en')}>
            locale: {locale}
          </Btn>
        </Row>

        <ThemeCtx.Provider value={theme}>
          <AuthCtx.Provider value={user}>
            <LocaleCtx.Provider value={locale}>
              <Row style={{ flexWrap: 'wrap', gap: 10 }}>
                <ThemedCard>themed card</ThemedCard>
                <UserBadge />
                <LocalizedUI />
                <MultiContextConsumer />
              </Row>
            </LocaleCtx.Provider>
          </AuthCtx.Provider>
        </ThemeCtx.Provider>

        <Pre>{`// Provider nesting — order is a convention, not a constraint
<ThemeCtx.Provider value={theme}>
  <AuthCtx.Provider value={user}>
    <LocaleCtx.Provider value={locale}>
      <ThemedCard />          // reads ThemeCtx only
      <UserBadge />           // reads AuthCtx only
      <LocalizedUI />         // reads LocaleCtx only
      <MultiContextConsumer/> // reads all three
    </LocaleCtx.Provider>
  </AuthCtx.Provider>
</ThemeCtx.Provider>

// Each consumer re-renders ONLY when its subscribed context changes`}</Pre>
      </Section>

      <Section title="5.2 Reading from Multiple Contexts">
        <Info>
          <code>MultiContextConsumer</code> calls <code>useContext</code> three times.
          It re-renders when ANY of the three contexts changes — it's subscribed to all of them.
          This is the cost of multiple subscriptions in one component.
        </Info>
        <Pre>{`// Component subscribed to 3 contexts
function MultiContextConsumer() {
  const theme  = useContext(ThemeCtx)   // subscription 1
  const user   = useContext(AuthCtx)    // subscription 2
  const locale = useContext(LocaleCtx)  // subscription 3
  // Re-renders if theme OR user OR locale changes
}

// If you only need one field from each context, consider:
// 1. Split the context further (theme.mode vs theme.colors)
// 2. Accept the re-render cost (often fine)
// 3. Context selector pattern (Experiment 9)`}</Pre>
      </Section>

      <Section title="5.3 Provider Nesting Order">
        <Info>
          Order of nested Providers only matters when the same context is nested (inner shadows outer).
          For different contexts, nesting order is irrelevant to behavior.
        </Info>
        <Pre>{`// These are equivalent — order doesn't matter for independent contexts:
<A.Provider><B.Provider><C.Provider>...</C.Provider></B.Provider></A.Provider>
<C.Provider><A.Provider><B.Provider>...</B.Provider></A.Provider></C.Provider>

// Order DOES matter for same context:
<ThemeCtx.Provider value="dark">
  <ThemeCtx.Provider value="light">  // inner wins for its subtree
    <Consumer />  // reads "light"
  </ThemeCtx.Provider>
</ThemeCtx.Provider>`}</Pre>
      </Section>
    </div>
  )
}
