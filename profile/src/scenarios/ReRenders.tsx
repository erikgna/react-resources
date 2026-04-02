import { memo, useState, Profiler, useEffect } from "react";
import { useRenderCount } from "../hooks/useRenderCount";
import { useProfilerData } from "../hooks/useProfilerData";
import { Dashboard } from "../components/Dashboard";
import { useOptimization } from "../contexts/OptimizationContext";

const ITEM_COUNT = 200;

// Static list of items (does NOT change between renders)
const items = Array.from({ length: ITEM_COUNT }, (_, i) => ({
  id: i,
  name: `Item ${i + 1}`,
}));

function ItemUnoptimized({ item }: { item: { id: number; name: string } }) {
  // Tracks how many times THIS component re-rendered
  const renders = useRenderCount(item.name);

  return (
    <div className="list-item">
      {item.name}
      {/* Visual indicator of re-renders */}
      <span className="render-badge">{renders}</span>
    </div>
  );
}

// Memoized version of the same component
// React will skip re-render if props are shallowly equal
const ItemOptimized = memo(function ItemOptimized({
  item,
}: {
  item: { id: number; name: string };
}) {
  const renders = useRenderCount(item.name);

  return (
    <div className="list-item optimized">
      {item.name}
      <span className="render-badge">{renders}</span>
    </div>
  );
});

export function ReRenders() {
  // Toggle between optimized vs unoptimized scenario
  const { optimized } = useOptimization();

  // Unrelated state (used to trigger parent re-renders)
  const [counter, setCounter] = useState(0);

  // Profiler to measure render cost
  const { stats, onRender, reset } = useProfilerData();

  // Reset stats whenever we switch modes
  useEffect(() => {
    reset();
  }, [optimized, reset]);

  // Dynamically choose which item component to render
  const ItemComponent = optimized ? ItemOptimized : ItemUnoptimized;

  return (
    <div className="scenario">
      <h2>Unnecessary Re-renders</h2>
      <p className="description">
        Parent state change triggers re-render. Badge shows render count per item.
        {optimized
          ? <> <code>React.memo</code> prevents children re-rendering when props are unchanged.</>
          : <> Items re-render on every counter increment even though their props didn't change.</>}
      </p>

      <div className="controls">
        <button className="btn" onClick={() => setCounter((c) => c + 1)}>
          Increment Counter: {counter}
        </button>
      </div>

      <Dashboard stats={stats} onReset={reset} />

      <div className="list-container">
        <Profiler id="ReRenders" onRender={onRender}>
          <div className="item-grid">
            {items.map((item) => (
              <ItemComponent key={item.id} item={item} />
            ))}
          </div>
        </Profiler>
      </div>
    </div>
  );
}
