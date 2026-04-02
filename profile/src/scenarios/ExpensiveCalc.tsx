import { Profiler, useState, useMemo, useEffect } from "react";
import { useProfilerData } from "../hooks/useProfilerData";
import { Dashboard } from "../components/Dashboard";
import { useOptimization } from "../contexts/OptimizationContext";

// Simulates a CPU-heavy calculation
// Runs ~5 million iterations → intentionally slow
function expensiveCalculation(n: number): number {
  let result = 0;

  for (let i = 0; i < 5e6; i++) {
    // Artificial work to block the main thread
    result += Math.sin(i) * n;
  }

  return result;
}

// Simple presentational component
function ResultDisplay({ value, label }: { value: number; label: string }) {
  return (
    <div className="result-box">
      <div className="result-label">{label}</div>
      <div className="result-value">{value.toFixed(4)}</div>
    </div>
  );
}

export function ExpensiveCalc() {
  const { optimized } = useOptimization(); // toggle memo vs non-memo

  const [count, setCount] = useState(1);   // drives the expensive calculation
  const [input, setInput] = useState("");  // unrelated state (used to trigger re-renders)

  const { stats, onRender, reset } = useProfilerData();

  // Reset profiler when switching modes
  useEffect(() => {
    reset();
  }, [optimized, reset]);

  // Memoized version of the expensive calculation
  // Only recomputes when `count` changes
  const memoizedValue = useMemo(() => {
    return expensiveCalculation(count);
  }, [count]);

  // Choose between optimized and non-optimized execution
  const value = optimized
    // useMemo prevents recomputation on unrelated renders
    ? memoizedValue
    // recalculates on EVERY render (even when only `input` changes)
    : expensiveCalculation(count);

  return (
    <div className="scenario">
      <h2>Expensive Computation</h2>
      <p className="description">
        Heavy CPU loop runs on every render.
        {optimized
          ? <> <code>useMemo</code> caches the result — only recomputes when <code>count</code> changes.</>
          : <> The calculation runs on every render including unrelated state changes like typing.</>}
      </p>

      <div className="controls">
        <button className="btn" onClick={() => setCount((c) => c + 1)}>
          Change Input (n={count})
        </button>
      </div>

      <div className="controls">
        <input
          className="text-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={optimized ? "Type freely — no lag" : "Type here — notice lag…"}
        />
      </div>

      <Dashboard stats={stats} onReset={reset} />

      <Profiler id="ExpensiveCalc" onRender={onRender}>
        <ResultDisplay
          value={value}
          label={optimized ? "useMemo result (cached)" : "Raw (recalculates every render)"}
        />
      </Profiler>
    </div>
  );
}
