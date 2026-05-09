import { createSignal, type JSX } from 'solid-js';
import SignalDemo from './SignalDemo';
import StoreDemo from './StoreDemo';
import MemoDemo from './MemoDemo';
import ContextDemo from './ContextDemo';
import ResourceDemo from './ResourceDemo';

type Mode = 'signal' | 'store' | 'memo' | 'context' | 'resource';

export default function App() {
  const [mode, setMode] = createSignal<Mode>('signal');

  return (
    <div style={{ padding: '24px', 'font-family': 'system-ui, sans-serif' }}>
      <h2 style={{ 'margin-bottom': '16px', 'font-size': '18px' }}>SolidJS POC</h2>
      <div style={{ display: 'flex', gap: '8px', 'margin-bottom': '24px', 'flex-wrap': 'wrap' }}>
        <button onClick={() => setMode('signal')} style={btn(mode() === 'signal', '#6366f1')}>
          Signal
        </button>
        <button onClick={() => setMode('store')} style={btn(mode() === 'store', '#059669')}>
          Store + Reconcile
        </button>
        <button onClick={() => setMode('memo')} style={btn(mode() === 'memo', '#d97706')}>
          Memo + untracked
        </button>
        <button onClick={() => setMode('context')} style={btn(mode() === 'context', '#8b5cf6')}>
          Context
        </button>
        <button onClick={() => setMode('resource')} style={btn(mode() === 'resource', '#0ea5e9')}>
          Resource
        </button>
      </div>
      {mode() === 'signal' && <SignalDemo />}
      {mode() === 'store' && <StoreDemo />}
      {mode() === 'memo' && <MemoDemo />}
      {mode() === 'context' && <ContextDemo />}
      {mode() === 'resource' && <ResourceDemo />}
    </div>
  );
}

function btn(active: boolean, color: string): JSX.CSSProperties {
  return {
    padding: '8px 20px',
    border: `2px solid ${color}`,
    'border-radius': '6px',
    background: active ? color : 'transparent',
    color: active ? '#fff' : color,
    cursor: 'pointer',
    'font-weight': '600',
    'font-size': '14px',
  };
}
