import { memo, useState, useRef, useCallback, Profiler, type ProfilerOnRenderCallback } from 'react';

interface Item {
  id: number;
  value: string;
  highlighted: boolean;
}

function generate(count: number): Item[] {
  return Array.from({ length: count }, (_, i) => ({ id: i, value: `Item ${i}`, highlighted: false }));
}

const ListItem = memo(function ListItem({ item }: { item: Item }) {
  return (
    <li style={{ background: item.highlighted ? '#ffd' : 'transparent', padding: '2px 8px', listStyle: 'none', fontSize: 13 }}>
      {item.value}
    </li>
  );
});

const SIZES = [500, 1_000];

export default function ReactList() {
  const [size, setSize] = useState(1_000);
  const [items, setItems] = useState(() => generate(1_000));
  const [renderCount, setRenderCount] = useState(0);
  const [renderMs, setRenderMs] = useState(0);
  const running = useRef(false);
  const latestMs = useRef(0);
  const rafRef = useRef(0);

  const onRender: ProfilerOnRenderCallback = (_id, _phase, actual) => {
    latestMs.current = actual;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setRenderMs(latestMs.current));
  };

  const applySize = useCallback((n: number) => {
    setSize(n);
    setItems(generate(n));
  }, []);

  const stress = useCallback(() => {
    if (running.current) return;
    running.current = true;
    const end = Date.now() + 3_000;

    const tick = () => {
      if (Date.now() > end) { running.current = false; return; }
      setItems(prev => {
        const next = [...prev];
        const idx = Math.floor(Math.random() * next.length);
        next[idx] = { ...next[idx], highlighted: !next[idx].highlighted };
        return next;
      });
      setRenderCount(c => c + 1);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  return (
    <div>
      <h3 style={{ margin: '0 0 12px', color: '#e44' }}>React (memo)</h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13 }}>Size:</span>
        {SIZES.map(s => (
          <button key={s} onClick={() => applySize(s)}
            style={{ fontWeight: size === s ? 'bold' : 'normal', padding: '4px 10px', cursor: 'pointer' }}>
            {s.toLocaleString()}
          </button>
        ))}
        <button onClick={stress}
          style={{ marginLeft: 8, background: '#e44', color: '#fff', border: 'none', padding: '4px 14px', borderRadius: 4, cursor: 'pointer' }}>
          Stress 3s
        </button>
        <span style={{ fontSize: 12, color: '#666' }}>
          Updates: {renderCount} | Render: {renderMs.toFixed(2)}ms
        </span>
      </div>
      <div style={{ overflow: 'auto', maxHeight: 500, border: '1px solid #eee', borderRadius: 4 }}>
        <Profiler id="react-list" onRender={onRender}>
          <ul style={{ margin: 0, padding: 0 }}>
            {items.map(item => <ListItem key={item.id} item={item} />)}
          </ul>
        </Profiler>
      </div>
    </div>
  );
}
