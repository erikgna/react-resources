import { createSignal, createEffect, onCleanup, For } from 'solid-js';
import { createStore, produce, reconcile } from 'solid-js/store';

interface Item {
  id: number;
  value: string;
  highlighted: boolean;
  updateCount: number;
}

function generate(count: number): Item[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    value: `Item ${i}`,
    highlighted: false,
    updateCount: 0,
  }));
}

const SIZES = [500, 1_000];

export default function StoreDemo() {
  const [size, setSize] = createSignal(1_000);
  const [store, setStore] = createStore({ items: generate(1_000) });
  const [updateCount, setUpdateCount] = createSignal(0);
  const [lastMs, setLastMs] = createSignal(0);
  const [running, setRunning] = createSignal(false);
  const [reconcileMs, setReconcileMs] = createSignal<number | null>(null);

  function applySize(n: number) {
    setSize(n);
    setStore({ items: generate(n) });
    setUpdateCount(0);
    setReconcileMs(null);
  }

  // Stress: single-item RAF update loop
  createEffect(() => {
    if (!running()) return;

    const end = Date.now() + 3_000;
    let rafId: number;

    const tick = () => {
      if (Date.now() > end) {
        setRunning(false);
        return;
      }

      const idx = Math.floor(Math.random() * store.items.length);
      const t0 = performance.now();

      setStore(
        produce(s => {
          s.items[idx].highlighted = !s.items[idx].highlighted;
          s.items[idx].updateCount += 1;
        })
      );

      setLastMs(performance.now() - t0);
      setUpdateCount(c => c + 1);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    onCleanup(() => cancelAnimationFrame(rafId));
  });

  // reconcile: simulate receiving fresh server data and diffing it efficiently.
  // Only items whose fields changed get their DOM nodes patched.
  function reconcileFromServer() {
    const serverItems: Item[] = store.items.map(item => ({
      ...item,
      highlighted: Math.random() < 0.15,
      updateCount: item.updateCount, // preserve local counter
    }));

    const t0 = performance.now();
    setStore('items', reconcile(serverItems, { key: 'id' }));
    const elapsed = performance.now() - t0;

    setReconcileMs(elapsed);
    setUpdateCount(c => c + 1);
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 12px', color: '#059669' }}>Store — Fine-Grained Updates + Reconcile</h3>
      <p style={{ 'font-size': '13px', color: '#666', 'margin-bottom': '12px' }}>
        <strong>Stress:</strong> single item toggled per RAF frame — only that row's DOM patches.
        <br />
        <strong>Reconcile:</strong> fresh server array diffed by id — only changed items update.
      </p>

      <div style={{ display: 'flex', gap: '8px', 'align-items': 'center', 'margin-bottom': '12px', 'flex-wrap': 'wrap' }}>
        <span style={{ 'font-size': '13px' }}>Size:</span>
        <For each={SIZES}>
          {s => (
            <button
              onClick={() => applySize(s)}
              style={{ 'font-weight': size() === s ? 'bold' : 'normal', padding: '4px 10px', cursor: 'pointer' }}
            >
              {s.toLocaleString()}
            </button>
          )}
        </For>
        <button
          onClick={() => setRunning(true)}
          disabled={running()}
          style={{
            background: running() ? '#aaa' : '#059669',
            color: '#fff',
            border: 'none',
            padding: '4px 14px',
            'border-radius': '4px',
            cursor: running() ? 'default' : 'pointer',
          }}
        >
          {running() ? 'Running…' : 'Stress 3s'}
        </button>
        <button
          onClick={reconcileFromServer}
          style={{
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            padding: '4px 14px',
            'border-radius': '4px',
            cursor: 'pointer',
          }}
        >
          Reconcile (server sync)
        </button>
        <span style={{ 'font-size': '12px', color: '#666' }}>
          Updates: {updateCount()} | produce: {lastMs().toFixed(3)}ms
          {reconcileMs() !== null && <> | reconcile: {reconcileMs()!.toFixed(3)}ms</>}
        </span>
      </div>

      <div style={{ overflow: 'auto', 'max-height': '500px', border: '1px solid #eee', 'border-radius': '4px' }}>
        <ul style={{ margin: 0, padding: 0 }}>
          <For each={store.items}>
            {item => (
              <li
                style={{
                  background: item.highlighted ? '#d1fae5' : 'transparent',
                  padding: '2px 8px',
                  'list-style': 'none',
                  'font-size': '13px',
                  display: 'flex',
                  'justify-content': 'space-between',
                }}
              >
                <span>{item.value}</span>
                <span style={{ color: item.updateCount > 0 ? '#059669' : '#ccc', 'font-size': '11px' }}>
                  updates: {item.updateCount}
                </span>
              </li>
            )}
          </For>
        </ul>
      </div>
    </div>
  );
}
