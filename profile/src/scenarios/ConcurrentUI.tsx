import { Profiler, useState, useTransition, useDeferredValue } from "react";
import { useProfilerData } from "../hooks/useProfilerData";
import { Dashboard } from "../components/Dashboard";
import { useOptimization } from "../contexts/OptimizationContext";

const TOTAL_ITEMS = 20_000;

// Pre-generate a large dataset (simulates heavy UI work)
const allItems = Array.from({ length: TOTAL_ITEMS }, (_, i) => ({
  id: i,
  label: `Item ${i + 1}: ${Math.random().toString(36).slice(2, 10)}`,
}));

function FilteredList({ filter }: { filter: string }) {
  // Expensive computation: filtering 20k items on every render
  const filtered = filter
    ? allItems.filter((item) => item.label.includes(filter)) // full scan
    : allItems.slice(0, 100); // fallback when no filter (cheap)

  return (
    <div className="concurrent-list">
      {/* Shows how many items matched */}
      <div className="concurrent-count">
        {filtered.length.toLocaleString()} results
      </div>

      {/* Render only first 200 items (avoids DOM overload, but CPU work still happens above) */}
      {filtered.slice(0, 200).map((item) => (
        <div key={item.id} className="virtual-row">
          {item.label}
        </div>
      ))}
    </div>
  );
}

function SyncFilter() {
  const [query, setQuery] = useState("");

  // Custom profiler hook to track render performance
  const { stats, onRender, reset } = useProfilerData();

  return (
    <div className="scenario">
      <p className="description">
        {/* Key idea: this approach blocks the main thread */}
        Each keystroke blocks the thread until the full list re-renders. Input feels sluggish.
      </p>

      <input
        className="text-input"
        value={query}
        // Every keystroke updates state synchronously → triggers heavy filtering immediately
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type to filter 20k items…"
        style={{ width: "100%", marginBottom: "0.5rem" }}
      />

      {/* Shows profiling metrics */}
      <Dashboard stats={stats} onReset={reset} />

      {/* React Profiler measures render cost */}
      <Profiler id="SyncFilter" onRender={onRender}>
        {/* Tight coupling: input → filter → expensive render */}
        <FilteredList filter={query} />
      </Profiler>
    </div>
  );
}

function TransitionFilter() {
  // Immediate value (input stays responsive)
  const [input, setInput] = useState("");

  // Deferred value used for expensive computation
  const [filter, setFilter] = useState("");

  // React concurrent feature
  const [isPending, startTransition] = useTransition();

  // Further defers rendering work (lets React "lag" behind intentionally)
  const deferred = useDeferredValue(filter);

  const { stats, onRender, reset } = useProfilerData();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;

    // Urgent update → keeps typing responsive
    setInput(val);

    // Non-urgent update → React may delay/interleave this work
    startTransition(() => {
      setFilter(val);
    });
  }

  return (
    <div className="scenario">
      <p className="description">
        <code>startTransition</code> marks the filter update as non-urgent. React yields to
        keep the input responsive. <code>useDeferredValue</code> passes the deferred value
        to the list. {isPending && <span className="pending-badge">updating…</span>}
      </p>
      <input
        className="text-input"
        value={input}
        onChange={handleChange}
        placeholder="Type to filter 20k items…"
        style={{ width: "100%", marginBottom: "0.5rem", opacity: isPending ? 0.7 : 1 }}
      />
      <Dashboard stats={stats} onReset={reset} />
      <Profiler id="TransitionFilter" onRender={onRender}>
        <FilteredList filter={deferred} />
      </Profiler>
    </div>
  );
}

export function ConcurrentUI() {
  const { optimized } = useOptimization();

  return (
    <div className="scenario">
      <h2>Concurrent UI — useTransition</h2>
      {optimized ? <TransitionFilter /> : <SyncFilter />}
    </div>
  );
}
