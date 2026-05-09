import { createSignal, createMemo, createEffect, onCleanup, untrack } from 'solid-js';

function fib(n: number): number {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}

export default function MemoDemo() {
  const [n, setN] = createSignal(10);
  const [tick, setTick] = createSignal(0);

  // createMemo tracks only the signals read inside it.
  // tick() is intentionally NOT read here — memo is blind to it.
  const fibResult = createMemo(() => fib(n()));

  // Track how many times the memo produced a new value.
  // Effect subscribes to fibResult() — fires only when memo output changes.
  // Side effects belong in createEffect, NOT inside createMemo.
  const [memoRunCount, setMemoRunCount] = createSignal(0);
  createEffect(() => {
    fibResult();
    setMemoRunCount(c => c + 1);
  });

  // untracked: read tick() without creating a subscription.
  // Useful when you need a value but don't want it to trigger recomputation.
  // untrack: call a function without creating reactive subscriptions.
  // Reading tick() inside untrack does NOT add tick as a memo dependency.
  const fibWithUntrackedTick = createMemo(() => {
    const result = fib(n());
    untrack(tick); // read tick but do NOT subscribe
    return result;
  });

  createEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1_000);
    onCleanup(() => clearInterval(id));
  });

  return (
    <div style={{ 'max-width': '520px' }}>
      <h3 style={{ margin: '0 0 12px', color: '#d97706' }}>Memo — Cached Derived State</h3>
      <p style={{ 'font-size': '13px', color: '#666', 'margin-bottom': '16px' }}>
        <code>createMemo</code> only recomputes when <em>its own</em> tracked signals change.
        Clock ticks every second — memo stays cached.
        Side effects (counting runs) belong in <code>createEffect</code>, not inside the memo.
      </p>

      <div style={{ display: 'flex', 'align-items': 'center', gap: '16px', 'margin-bottom': '20px' }}>
        <label style={{ 'font-size': '14px', 'font-weight': '600', 'white-space': 'nowrap' }}>
          N = {n()}
        </label>
        <input
          type="range"
          min="1"
          max="40"
          value={n()}
          onInput={e => setN(Number(e.currentTarget.value))}
          style={{ flex: '1' }}
        />
      </div>

      <div style={{
        display: 'grid',
        'grid-template-columns': '1fr 1fr 1fr',
        gap: '12px',
        'margin-bottom': '20px',
      }}>
        <StatCard label="fib(N)" value={fibResult()} color="#d97706" />
        <StatCard label="Memo recomputed" value={memoRunCount()} color="#6366f1" />
        <StatCard label="Clock ticks" value={tick()} color="#059669" />
      </div>

      <div style={{ 'font-size': '12px', color: '#888', 'line-height': '1.7', background: '#f9f9f9', padding: '12px', 'border-radius': '6px' }}>
        <strong>Experiment 1 — Drag slider:</strong> "Memo recomputed" increments. fib recalculates.<br />
        <strong>Experiment 2 — Wait:</strong> Clock ticks but "Memo recomputed" stays frozen.<br />
        <strong>Experiment 3 — untracked:</strong> <code>fibWithUntrackedTick</code> reads tick() without subscribing.
        Memo does not rerun on ticks even though tick() is read.
        Current value: <strong>{fibWithUntrackedTick()}</strong> (always equals fib(N) — tick has no effect).
      </div>
    </div>
  );
}

function StatCard(props: { label: string; value: number; color: string }) {
  return (
    <div style={{
      border: `2px solid ${props.color}`,
      'border-radius': '8px',
      padding: '12px',
      'text-align': 'center',
    }}>
      <div style={{ 'font-size': '11px', color: '#888', 'margin-bottom': '4px' }}>{props.label}</div>
      <div style={{ 'font-size': '22px', 'font-weight': '700', color: props.color }}>{props.value}</div>
    </div>
  );
}
