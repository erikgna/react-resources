import {
  createContext,
  memo,
  Profiler,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useProfilerData } from "../hooks/useProfilerData";
import { Dashboard } from "../components/Dashboard";
import { useOptimization } from "../contexts/OptimizationContext";

// ─── Bad: single context holds everything ────────────────────────────────────

interface AppState {
  theme: string;
  counter: number;
}

// Single context holding multiple values
// Any change to ANY field → ALL consumers re-render
const SingleContext = createContext<AppState>({ theme: "dark", counter: 0 });

// Separate context for actions (good practice, stable reference)
const SingleDispatch = createContext<() => void>(() => { });

function SingleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    theme: "dark",
    counter: 0,
  });

  // Stable function (doesn't change between renders)
  const inc = useCallback(
    () => setState((s) => ({ ...s, counter: s.counter + 1 })),
    []
  );

  return (
    // Problem: new `state` object every update → ALL consumers re-render
    <SingleContext.Provider value={state}>
      <SingleDispatch.Provider value={inc}>
        {children}
      </SingleDispatch.Provider>
    </SingleContext.Provider>
  );
}

// BAD: even though this only uses `theme`,
// it re-renders when `counter` changes
function ThemeConsumerBad() {
  const { theme } = useContext(SingleContext);

  const renders = useRef(0);
  renders.current++;

  return (
    <div className="ctx-card bad">
      <span>Theme: {theme}</span>
      <span className="render-badge">{renders.current}</span>
    </div>
  );
}

// BAD: updates counter → forces ALL consumers to re-render
function CounterConsumerBad() {
  const { counter } = useContext(SingleContext);
  const inc = useContext(SingleDispatch);

  const renders = useRef(0);
  renders.current++;

  return (
    <div className="ctx-card bad">
      <button className="btn" onClick={inc}>
        Counter: {counter}
      </button>
      <span className="render-badge">{renders.current}</span>
    </div>
  );
}
// Each piece of state gets its own context
const ThemeContext = createContext("dark");
const CounterContext = createContext(0);
const CounterDispatch = createContext<() => void>(() => { });

function SplitProvider({ children }: { children: React.ReactNode }) {
  const [theme] = useState("dark"); // static (never changes)
  const [counter, setCounter] = useState(0);

  const inc = useCallback(() => setCounter((c) => c + 1), []);

  return (
    // ✅ Now updates are isolated
    <ThemeContext.Provider value={theme}>
      <CounterContext.Provider value={counter}>
        <CounterDispatch.Provider value={inc}>
          {children}
        </CounterDispatch.Provider>
      </CounterContext.Provider>
    </ThemeContext.Provider>
  );
}

// Memo helps avoid parent-driven re-renders
const ThemeConsumerGood = memo(function ThemeConsumerGood() {
  const theme = useContext(ThemeContext);

  const renders = useRef(0);
  renders.current++;

  return (
    <div className="ctx-card good">
      <span>Theme: {theme}</span>
      <span className="render-badge">{renders.current}</span>
    </div>
  );
});

const CounterConsumerGood = memo(function CounterConsumerGood() {
  const counter = useContext(CounterContext);
  const inc = useContext(CounterDispatch);

  const renders = useRef(0);
  renders.current++;

  return (
    <div className="ctx-card good">
      <button className="btn" onClick={inc}>
        Counter: {counter}
      </button>
      <span className="render-badge">{renders.current}</span>
    </div>
  );
});

// Attempts to select part of the state
function useMemoSelector<T>(
  ctx: React.Context<AppState>,
  select: (s: AppState) => T
): T {
  const state = useContext(ctx);

  // This memo only avoids recomputing `select`
  // It does NOT prevent re-renders
  return useMemo(() => select(state), [state, select]);
}

const MemoSelectorConsumer = memo(function MemoSelectorConsumer() {
  const counter = useMemoSelector(
    SingleContext,
    useCallback((s) => s.counter, [])
  );

  const renders = useRef(0);
  renders.current++;

  return (
    <div className="ctx-card memo">
      <span>useMemo selector: {counter}</span>
      <span className="render-badge">{renders.current}</span>
    </div>
  );
});

// ─── Scenario shell ───────────────────────────────────────────────────────────

export function ContextTrap() {
  const { optimized } = useOptimization();
  const { stats, onRender, reset } = useProfilerData();

  useEffect(() => { reset(); }, [optimized, reset]);

  return (
    <div className="scenario">
      <h2>Context Performance Trap</h2>
      <p className="description">
        {optimized
          ? <>Split contexts + <code>memo</code>: counter update only re-renders the Counter card. Theme cards stay frozen.</>
          : <>Single context: any value change re-renders <em>every</em> consumer — even components that only care about theme.</>}
        {" "}Badge = render count.
      </p>

      <Dashboard stats={stats} onReset={reset} />

      <Profiler id="ContextTrap" onRender={onRender}>
        {optimized ? (
          <SplitProvider>
            <ThemeConsumerGood />
            <ThemeConsumerGood />
            <ThemeConsumerGood />
            <CounterConsumerGood />
            <MemoSelectorConsumer />
          </SplitProvider>
        ) : (
          <SingleProvider>
            <ThemeConsumerBad />
            <ThemeConsumerBad />
            <ThemeConsumerBad />
            <CounterConsumerBad />
          </SingleProvider>
        )}
      </Profiler>

      <p className="description">
        Click the <strong>Counter</strong> button above and watch the render badges.
      </p>
    </div>
  );
}
