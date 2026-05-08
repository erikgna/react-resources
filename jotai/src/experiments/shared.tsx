import { Component, type CSSProperties, type ReactNode } from 'react'

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

export function Badge({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span style={{
      background: color + '22', border: `1px solid ${color}55`,
      color, borderRadius: 3, padding: '2px 8px', fontSize: 11,
    }}>
      {children}
    </span>
  )
}

export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: (err: Error) => ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch() { /* intentional catch */ }
  reset = () => this.setState({ error: null })
  render() {
    if (this.state.error) {
      return this.props.fallback
        ? this.props.fallback(this.state.error)
        : (
          <div style={{ background: '#1a0808', border: '1px solid #5a1111', borderRadius: 4, padding: 14 }}>
            <div style={{ color: '#ff6b6b', fontSize: 12, marginBottom: 6 }}>Caught by ErrorBoundary</div>
            <div style={{ color: '#cc4444', fontSize: 12, fontFamily: 'monospace' }}>{this.state.error.message}</div>
            <button onClick={this.reset} style={{ marginTop: 10, padding: '4px 10px', background: '#2a1111', border: '1px solid #5a1111', color: '#ff6b6b', borderRadius: 3, fontSize: 11, cursor: 'pointer' }}>
              Reset
            </button>
          </div>
        )
    }
    return this.props.children
  }
}
