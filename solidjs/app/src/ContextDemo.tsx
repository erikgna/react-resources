import {
  createContext,
  useContext,
  createSignal,
  createEffect,
  onCleanup,
  type Accessor,
  type JSX,
} from 'solid-js';

interface ThemeCtx {
  color: Accessor<string>;
  count: Accessor<number>;
  username: Accessor<string>;
}

// Context holds signal ACCESSORS, not plain values.
// Consumers subscribe only to the signals they actually read.
// React context: any context value change re-renders ALL consumers.
// SolidJS context: only consumers reading the changed signal re-evaluate.
const ThemeContext = createContext<ThemeCtx>();

function useTheme() {
  return useContext(ThemeContext)!;
}

// Each panel subscribes only to its own signal.
// createEffect fires each time that signal changes — that's the eval counter.
function ColorPanel() {
  const { color } = useTheme();
  const [evals, setEvals] = createSignal(0);
  createEffect(() => { color(); setEvals(c => c + 1); });

  return (
    <Panel label="COLOR" sublabel="updates at 60fps when running" borderColor="#6366f1">
      <div style={{ height: '48px', background: color(), 'border-radius': '4px', 'margin-bottom': '8px', transition: 'background 0.05s' }} />
      <code style={{ 'font-size': '12px' }}>{color()}</code>
      <EvalBadge count={evals()} color="#6366f1" />
    </Panel>
  );
}

function CountPanel() {
  const { count } = useTheme();
  const [evals, setEvals] = createSignal(0);
  createEffect(() => { count(); setEvals(c => c + 1); });

  return (
    <Panel label="COUNT" sublabel="updates every 1s" borderColor="#059669">
      <div style={{ 'font-size': '36px', 'font-weight': '700', color: '#059669', 'margin-bottom': '8px' }}>
        {count()}
      </div>
      <EvalBadge count={evals()} color="#059669" />
    </Panel>
  );
}

function UsernamePanel() {
  const { username } = useTheme();
  const [evals, setEvals] = createSignal(0);
  createEffect(() => { username(); setEvals(c => c + 1); });

  return (
    <Panel label="USERNAME" sublabel="never changes" borderColor="#d97706">
      <div style={{ 'font-size': '20px', 'font-weight': '600', color: '#d97706', 'margin-bottom': '8px' }}>
        {username()}
      </div>
      <EvalBadge count={evals()} color="#d97706" />
    </Panel>
  );
}

function Panel(props: { label: string; sublabel: string; borderColor: string; children: JSX.Element }) {
  return (
    <div style={{
      border: `2px solid ${props.borderColor}`,
      'border-radius': '8px',
      padding: '14px',
      flex: '1',
    }}>
      <div style={{ 'font-size': '11px', color: '#888', 'margin-bottom': '2px', 'font-weight': '600', 'letter-spacing': '0.05em' }}>
        {props.label}
      </div>
      <div style={{ 'font-size': '10px', color: '#bbb', 'margin-bottom': '10px' }}>{props.sublabel}</div>
      {props.children}
    </div>
  );
}

function EvalBadge(props: { count: number; color: string }) {
  return (
    <div style={{ 'font-size': '12px', color: '#888', 'margin-top': '8px' }}>
      Reactive evals: <strong style={{ color: props.color }}>{props.count}</strong>
    </div>
  );
}

export default function ContextDemo() {
  const [color, setColor] = createSignal('#6366f1');
  const [count, setCount] = createSignal(0);
  const [username] = createSignal('alice');
  const [running, setRunning] = createSignal(false);

  // Color: 60fps RAF loop
  createEffect(() => {
    if (!running()) return;
    let rafId: number;
    const tick = () => {
      setColor(`hsl(${Math.floor(Math.random() * 360)}, 65%, 45%)`);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    onCleanup(() => cancelAnimationFrame(rafId));
  });

  // Count: 1hz
  createEffect(() => {
    if (!running()) return;
    const id = setInterval(() => setCount(c => c + 1), 1_000);
    onCleanup(() => clearInterval(id));
  });

  return (
    <div style={{ 'max-width': '640px' }}>
      <h3 style={{ margin: '0 0 12px', color: '#8b5cf6' }}>Context — Isolated Signal Subscriptions</h3>
      <p style={{ 'font-size': '13px', color: '#666', 'margin-bottom': '16px' }}>
        Context provides signal accessors — not values. Each consumer subscribes only to what it reads.
        In React, any context change re-renders all consumers. Here, only the relevant panel's
        reactive expression updates.
      </p>

      <div style={{ 'margin-bottom': '16px' }}>
        <button
          onClick={() => setRunning(r => !r)}
          style={{
            padding: '10px 24px',
            background: running() ? '#dc2626' : '#8b5cf6',
            color: '#fff',
            border: 'none',
            'border-radius': '6px',
            cursor: 'pointer',
            'font-weight': '600',
            'font-size': '14px',
          }}
        >
          {running() ? 'STOP' : 'START (color=60fps, count=1hz)'}
        </button>
      </div>

      <ThemeContext.Provider value={{ color, count, username }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <ColorPanel />
          <CountPanel />
          <UsernamePanel />
        </div>
      </ThemeContext.Provider>

      <div style={{ 'margin-top': '16px', 'font-size': '12px', color: '#888', 'line-height': '1.7', background: '#f9f9f9', padding: '12px', 'border-radius': '6px' }}>
        <strong>What to observe:</strong><br />
        Color panel eval count rockets (60 per second).<br />
        Count panel eval count increments once per second.<br />
        Username panel eval count stays at 1 (initial subscription only).<br />
        All three panels share the same context. None of them "re-render" — only reactive expressions update.
      </div>
    </div>
  );
}
