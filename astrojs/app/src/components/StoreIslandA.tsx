import { useStore } from "@nanostores/react";
import { $count } from "../stores/shared";

export default function StoreIslandA() {
  const count = useStore($count);

  return (
    <div style={s.box}>
      <div style={s.label}>Island A — Controls</div>
      <div style={s.display}>{count}</div>
      <div style={s.row}>
        <button style={s.btn} onClick={() => $count.set(count - 1)}>−</button>
        <button style={{ ...s.btn, ...s.reset }} onClick={() => $count.set(0)}>Reset</button>
        <button style={s.btn} onClick={() => $count.set(count + 1)}>+</button>
      </div>
      <p style={s.note}>Writes to <code>$count</code> store. Island B reacts instantly — no prop drilling, no shared React tree.</p>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  box: { border: "2px solid #94a", borderRadius: 12, padding: 20, background: "#faf0ff", fontFamily: "system-ui, sans-serif" },
  label: { fontSize: 11, fontWeight: "bold", color: "#94a", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 },
  display: { fontSize: 48, fontWeight: "bold", textAlign: "center", padding: 12, background: "#e8d8ff", borderRadius: 8, marginBottom: 12, color: "#5a1a8a" },
  row: { display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 },
  btn: { fontSize: 20, width: 48, height: 48, borderRadius: 8, border: "2px solid #94a", background: "#94a", color: "white", cursor: "pointer" },
  reset: { width: 64, fontSize: 12, fontWeight: "bold" },
  note: { fontSize: 12, color: "#666", margin: 0, lineHeight: 1.5 },
};
