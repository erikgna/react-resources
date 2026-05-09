import { createSignal, createEffect, onCleanup } from 'solid-js';

export default function SignalDemo() {
  // Component body runs exactly once. This counter proves it.
  let componentRunCount = 0;
  componentRunCount++;

  const [value, setValue] = createSignal(0);
  const [color, setColor] = createSignal('#6366f1');
  const [isRunning, setIsRunning] = createSignal(false);

  createEffect(() => {
    if (!isRunning()) return;

    let rafId: number;

    const tick = () => {
      setValue(Math.random());
      setColor(`hsl(${Math.floor(Math.random() * 360)}, 70%, 45%)`);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    // createEffect cleanup runs when effect re-runs or component unmounts
    onCleanup(() => cancelAnimationFrame(rafId));
  });

  return (
    <div style={{ 'max-width': '440px' }}>
      <p style={{ 'font-size': '13px', color: '#666', 'margin-bottom': '12px' }}>
        Component body ran: <strong>{componentRunCount}</strong> time(s).
        Signals update DOM directly — component never re-runs.
      </p>

      <button
        onClick={() => setIsRunning(r => !r)}
        style={{
          width: '100%',
          padding: '12px',
          'margin-bottom': '20px',
          'border-radius': '8px',
          border: 'none',
          background: isRunning() ? '#dc2626' : '#6366f1',
          color: 'white',
          'font-weight': 'bold',
          cursor: 'pointer',
          'font-size': '14px',
        }}
      >
        {isRunning() ? 'STOP' : 'START 60FPS LOOP'}
      </button>

      <div
        style={{
          'background-color': color(),
          padding: '24px',
          'border-radius': '12px',
          color: '#fff',
          'font-family': 'monospace',
          'text-align': 'center',
          'font-size': '28px',
          'border': '4px solid rgba(255,255,255,0.2)',
          transition: 'background-color 0.05s',
        }}
      >
        VALUE: {value().toFixed(6)}
      </div>

      <div style={{ 'margin-top': '16px', 'font-size': '12px', color: '#888', 'line-height': '1.6' }}>
        <strong>How it works:</strong> <code>createSignal</code> returns a getter + setter.
        Reading <code>value()</code> inside JSX creates a subscription.
        When the signal updates, only that DOM text node is patched.
        No component re-run. No VDOM diff.
      </div>
    </div>
  );
}
