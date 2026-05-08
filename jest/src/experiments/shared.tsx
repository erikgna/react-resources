import type { ReactNode, CSSProperties } from 'react'

const CODE: CSSProperties = {
  display: 'block', background: '#1a1a1a', border: '1px solid #2a2a2a',
  borderRadius: 6, padding: '14px 16px', fontFamily: 'monospace',
  fontSize: 13, lineHeight: 1.6, color: '#abb2bf', overflowX: 'auto',
  whiteSpace: 'pre', marginBottom: 16,
}

const SECTION: CSSProperties = {
  marginBottom: 36,
}

const H1: CSSProperties = {
  color: '#e5c07b', fontSize: 11, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4,
}

const H2: CSSProperties = {
  color: '#c678dd', fontSize: 18, fontWeight: 600, marginBottom: 12, marginTop: 0,
}

const NOTE: CSSProperties = {
  background: '#1a1a1a', border: '1px solid #2a2a2a', borderLeft: '3px solid #61afef',
  borderRadius: 4, padding: '10px 14px', fontSize: 13, color: '#888',
  marginBottom: 16, lineHeight: 1.6,
}

const TAG: CSSProperties = {
  display: 'inline-block', background: '#2a2a2a', color: '#98c379',
  borderRadius: 4, padding: '1px 8px', fontSize: 11, fontFamily: 'monospace',
  marginRight: 6, marginBottom: 6,
}

export function Section({ children }: { children: ReactNode }) {
  return <div style={SECTION}>{children}</div>
}

export function Label({ children }: { children: ReactNode }) {
  return <div style={H1}>{children}</div>
}

export function Title({ children }: { children: ReactNode }) {
  return <h2 style={H2}>{children}</h2>
}

export function Code({ children }: { children: string }) {
  return <pre style={CODE}>{children}</pre>
}

export function Note({ children }: { children: ReactNode }) {
  return <div style={NOTE}>{children}</div>
}

export function Tag({ children }: { children: ReactNode }) {
  return <span style={TAG}>{children}</span>
}

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 style={{ color: '#c678dd', fontSize: 22, fontWeight: 700, marginBottom: 4, marginTop: 0 }}>
      {children}
    </h1>
  )
}

export function Subtitle({ children }: { children: ReactNode }) {
  return (
    <p style={{ color: '#555', fontSize: 13, marginTop: 0, marginBottom: 32 }}>
      {children}
    </p>
  )
}

export function Divider() {
  return <hr style={{ border: 'none', borderTop: '1px solid #222', margin: '32px 0' }} />
}
