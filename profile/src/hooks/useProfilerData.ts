import { useCallback, useRef, useState } from "react";

export interface ProfilerEntry {
  id: string;
  phase: string;
  actualDuration: number;
  timestamp: number;
}

export interface ProfilerStats {
  entries: ProfilerEntry[];
  count: number;
  lastDuration: number;
  avgDuration: number;
}

export function useProfilerData() {
  // State to store profiling statistics
  const [stats, setStats] = useState<ProfilerStats>({
    entries: [],        // last N profiler entries (history)
    count: 0,           // total number of renders recorded
    lastDuration: 0,    // duration of the most recent render
    avgDuration: 0,     // average render duration across all renders
  });

  // Mutable ref to keep a running total of all durations
  // Using useRef avoids re-renders when this value changes
  const totalRef = useRef(0);

  // Callback passed to React.Profiler
  // This runs on every commit (render)
  const onRender = useCallback(
    (id: string, phase: string, actualDuration: number) => {
      // Accumulate total render time
      totalRef.current += actualDuration;

      // Defer state update to avoid blocking render phase
      // (keeps profiler overhead lower)
      setTimeout(() => {
        setStats((prev) => {
          const newCount = prev.count + 1;

          // Create a new profiling entry for this render
          const entry: ProfilerEntry = {
            id,                   // Profiler ID (component tree label)
            phase,                // "mount" or "update"
            actualDuration,       // time spent rendering this update
            timestamp: Date.now()// when this render happened
          };

          // Keep only the last 20 entries (sliding window)
          const entries = [...prev.entries.slice(-19), entry];

          return {
            entries,
            count: newCount,
            lastDuration: actualDuration,
            // Compute average using total accumulated duration
            avgDuration: totalRef.current / newCount,
          };
        });
      }, 0);
    },
    []
  );

  // Reset all profiling data
  const reset = useCallback(() => {
    totalRef.current = 0; // reset accumulated duration
    setStats({
      entries: [],
      count: 0,
      lastDuration: 0,
      avgDuration: 0,
    });
  }, []);

  return { stats, onRender, reset };
}
