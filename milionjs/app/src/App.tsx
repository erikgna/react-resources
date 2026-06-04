import MillionTicker from "./MillionTicker";
import MillionList from "./MillionList";

// Two Million.js features, side by side. No React baselines, no pickers — just the two
// APIs you need to understand the library:
//   block()  → MillionTicker (one component, fast primitive-prop updates)
//   <For>     → MillionList   (large list, only the changed row is patched)
export default function App() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", display: "grid", gap: 40 }}>
      <section>
        <h2 style={{ margin: "0 0 4px" }}>block()</h2>
        <p style={{ margin: "0 0 12px", color: "#666", fontSize: 14 }}>
          Hyper-optimized component. Dirty-checks primitive props, patches the DOM directly.
        </p>
        <MillionTicker />
      </section>

      <section>
        <h2 style={{ margin: "0 0 4px" }}>&lt;For&gt;</h2>
        <p style={{ margin: "0 0 12px", color: "#666", fontSize: 14 }}>
          Drop-in for .map(). Auto-blocks each row; only the changed row re-renders.
        </p>
        <MillionList />
      </section>
    </div>
  );
}
