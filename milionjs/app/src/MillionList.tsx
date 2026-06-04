import { useState, useRef, useCallback } from 'react';
import { For } from 'million/react';

interface Item {
  id: number;
  value: string;
  highlighted: boolean;
}

function generate(count: number): Item[] {
  return Array.from({ length: count }, (_, i) => ({ id: i, value: `Item ${i}`, highlighted: false }));
}

// Plain component — NOT wrapped in block(). <For> auto-blocks each child internally;
// wrapping it again yourself double-blocks and breaks Million. Manual block() is only for
// standalone islands (see MillionTicker), never for <For> children.
function ListItem({ item }: { item: Item }) {
  return (
    <li style={{ background: item.highlighted ? '#dfd' : 'transparent', padding: '2px 8px', listStyle: 'none', fontSize: 13 }}>
      {item.value}
    </li>
  );
}

export default function MillionList() {
  const [items, setItems] = useState(() => generate(1_000));
  const [updates, setUpdates] = useState(0);
  const running = useRef(false);

  // Stress: for 3s, toggle exactly ONE row per frame. This is where <For> wins — React
  // would re-walk all 1,000 rows to find the change; Million patches only the changed <li>.
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
      setUpdates(c => c + 1);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <button onClick={stress}
          style={{ background: '#4a4', color: '#fff', border: 'none', padding: '4px 14px', borderRadius: 4, cursor: 'pointer' }}>
          Stress 3s (1,000 rows)
        </button>
        <span style={{ fontSize: 12, color: '#666' }}>Updates: {updates}</span>
      </div>
      <div style={{ overflow: 'auto', maxHeight: 400, border: '1px solid #eee', borderRadius: 4 }}>
        <ul style={{ margin: 0, padding: 0 }}>
          {/* <For> replaces {items.map()} and moves list diffing out of React's VDOM. */}
          <For each={items}>
            {(item) => <ListItem key={item.id} item={item} />}
          </For>
        </ul>
      </div>
    </div>
  );
}
