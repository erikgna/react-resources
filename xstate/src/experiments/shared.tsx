import type { CSSProperties, ReactNode } from 'react'

export const ui = {
  h2: { fontSize: 18, marginBottom: 8, color: '#e0e0e0' } as CSSProperties,
  desc: { color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 } as CSSProperties,
  input: {
    background: '#111', border: '1px solid #2a2a2a', color: '#e0e0e0',
    padding: '5px 9px', borderRadius: 3, fontSize: 13, outline: 'none',
  } as CSSProperties,
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{
      background: '#141414', border: '1px solid #1e1e1e', borderRadius: 4,
      padding: 18, marginBottom: 14,
    }}>
      <h3 style={{ fontSize: 12, color: '#4a9eff', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

export function Row({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', ...style }}>
      {children}
    </div>
  )
}

export function Btn({ onClick, children, danger }: { onClick: () => void; children: ReactNode; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 12px', background: danger ? '#2a1111' : '#1e1e1e',
      border: `1px solid ${danger ? '#5a1111' : '#2a2a2a'}`,
      color: danger ? '#ff6b6b' : '#c0c0c0', borderRadius: 3, fontSize: 12,
    }}>
      {children}
    </button>
  )
}

export function Info({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <p style={{ fontSize: 13, color: '#888', marginBottom: 10, lineHeight: 1.6, ...style }}>
      {children}
    </p>
  )
}

export function Pre({ children }: { children: ReactNode }) {
  return (
    <pre style={{
      background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 3,
      padding: 12, fontSize: 12, overflowX: 'auto', color: '#7ec8a0',
      marginTop: 10, lineHeight: 1.6,
    }}>
      {children}
    </pre>
  )
}

export function Box({
  name, renders, active = false, children,
}: {
  name: string; renders: number; active?: boolean; children: ReactNode
}) {
  return (
    <div style={{
      border: `1px solid ${active ? '#4a9eff' : '#1e1e1e'}`,
      borderRadius: 3, padding: '10px 14px', background: '#0f0f0f', minWidth: 170,
    }}>
      <div style={{ fontSize: 10, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
        {name}
      </div>
      <div style={{ fontSize: 14, color: '#e0e0e0', marginBottom: 6 }}>{children}</div>
      <div style={{ fontSize: 11, color: renders > 3 ? '#ff6b6b' : '#4caf50' }}>
        renders: {renders}
      </div>
    </div>
  )
}

export function Log({ entries }: { entries: string[] }) {
  return (
    <div style={{
      background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 3,
      padding: 10, maxHeight: 180, overflowY: 'auto', marginTop: 10, fontSize: 12,
      fontFamily: 'monospace',
    }}>
      {entries.length === 0
        ? <span style={{ color: '#333' }}>— no actions yet —</span>
        : entries.map((e, i) => <div key={i} style={{ color: '#7ec8a0', lineHeight: 1.5 }}>{e}</div>)
      }
    </div>
  )
}

export function StateChip({ value, active }: { value: string; active: boolean }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 12,
      background: active ? '#0d2137' : '#111',
      border: `1px solid ${active ? '#4a9eff' : '#222'}`,
      color: active ? '#4a9eff' : '#444',
      transition: 'all 0.15s',
    }}>
      {value}
    </span>
  )
}
