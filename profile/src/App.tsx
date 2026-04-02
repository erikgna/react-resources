import { useState } from "react";
import { OptimizationProvider, useOptimization } from "./contexts/OptimizationContext";
import { ReRenders } from "./scenarios/ReRenders";
import { ExpensiveCalc } from "./scenarios/ExpensiveCalc";
import { LargeList } from "./scenarios/LargeList";
import { ContextTrap } from "./scenarios/ContextTrap";
import { ConcurrentUI } from "./scenarios/ConcurrentUI";

type Scenario = "rerenders" | "expensive" | "largelist" | "context" | "concurrent";

const scenarios: { id: Scenario; label: string }[] = [
  { id: "rerenders", label: "Re-renders" },
  { id: "expensive", label: "Expensive Calc" },
  { id: "largelist", label: "Large List" },
  { id: "context", label: "Context Trap" },
  { id: "concurrent", label: "Concurrent UI" },
];

function GlobalToggle() {
  const { optimized, toggle } = useOptimization();
  return (
    <button
      className={`opt-toggle ${optimized ? "opt-on" : "opt-off"}`}
      onClick={toggle}
    >
      {optimized ? "Optimized ON" : "Unoptimized"}
    </button>
  );
}

function AppShell() {
  const [active, setActive] = useState<Scenario>("rerenders");

  return (
    <div className="app">
      <header className="app-header">
        <h1>React Performance POC</h1>
        <nav className="nav">
          {scenarios.map((s) => (
            <button
              key={s.id}
              className={`nav-btn ${active === s.id ? "active" : ""}`}
              onClick={() => setActive(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>
        <GlobalToggle />
      </header>
      <main className="app-main">
        {active === "rerenders" && <ReRenders />}
        {active === "expensive" && <ExpensiveCalc />}
        {active === "largelist" && <LargeList />}
        {active === "context" && <ContextTrap />}
        {active === "concurrent" && <ConcurrentUI />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <OptimizationProvider>
      <AppShell />
    </OptimizationProvider>
  );
}
