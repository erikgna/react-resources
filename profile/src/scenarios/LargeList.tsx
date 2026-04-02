import { type CSSProperties, Profiler, useState, useEffect } from "react";
import { List } from "react-window";
import { useProfilerData } from "../hooks/useProfilerData";
import { Dashboard } from "../components/Dashboard";
import { useOptimization } from "../contexts/OptimizationContext";

const TOTAL_ITEMS = 10_000;

const allItems = Array.from({ length: TOTAL_ITEMS }, (_, i) => ({
  id: i,
  label: `Row ${i + 1} — value: ${(Math.random() * 1000).toFixed(2)}`,
}));

// Props expected by the virtualization library
type BuiltinRowProps = {
  // Accessibility metadata (provided by the virtualizer)
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
  index: number;        // index of the item to render
  style: CSSProperties; // inline styles (positioning, height, etc.)
};

// Row renderer for virtualized list
function VirtualRow({ index, style }: BuiltinRowProps) {
  return (
    // IMPORTANT: style must be applied (controls absolute positioning)
    <div style={style} className="virtual-row virtualized">
      {/* Only render the visible item based on index */}
      {allItems[index].label}
    </div>
  );
}

// Naive approach: render EVERYTHING
function NaiveList() {
  return (
    <div className="naive-list">
      {allItems.map((item) => (
        <div key={item.id} className="virtual-row">
          {item.label}
        </div>
      ))}
    </div>
  );
  // Problem:
  // - Creates thousands of DOM nodes
  // - High memory usage
  // - Slow initial render
  // - Slow updates
}

// Virtualized list: render only what's visible
function VirtualList() {
  return (
    <List
      rowComponent={VirtualRow} // custom row renderer
      rowCount={TOTAL_ITEMS}    // total number of items
      rowHeight={36}            // fixed height per row (important for calculation)
      rowProps={{}}             // extra props passed to each row
      style={{ height: 400 }}   // viewport height (controls how many rows are visible)
    />
  );
  // Benefit:
  // - Only ~10–20 rows rendered at a time
  // - Massive DOM reduction
  // - Smooth scrolling
}

// Main demo component
export function LargeList() {
  const { optimized } = useOptimization(); // toggle naive vs virtualized

  const [mounted, setMounted] = useState(false);

  // Profiler to measure render performance
  const { stats, onRender, reset } = useProfilerData();

  // Reset stats when switching modes
  // Also force remount to measure initial render cost
  useEffect(() => {
    reset();
    setMounted(false);
  }, [optimized, reset]);

  function handleMount() {
    setMounted(false);
    setTimeout(() => setMounted(true), 0);
  }

  return (
    <div className="scenario">
      <h2>Large List — Virtualization</h2>
      <p className="description">
        Rendering {TOTAL_ITEMS.toLocaleString()} items.
        {optimized
          ? <> <code>react-window</code> renders only the visible rows — DOM stays small.</>
          : <> All {TOTAL_ITEMS.toLocaleString()} DOM nodes are created and painted at once.</>}
      </p>

      <div className="controls">
        <button className="btn" onClick={handleMount}>
          {mounted ? "Re-mount" : "Mount List"}
        </button>
      </div>

      <Dashboard stats={stats} onReset={reset} />

      {mounted && (
        <Profiler id="LargeList" onRender={onRender}>
          {optimized ? <VirtualList /> : <NaiveList />}
        </Profiler>
      )}
    </div>
  );
}
