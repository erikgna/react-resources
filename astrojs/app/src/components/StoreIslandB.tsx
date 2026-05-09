import { useStore } from "@nanostores/react";
import { $count, $doubled, $label } from "../stores/shared";

const labelColors: Record<string, string> = {
  positive: "#4a4",
  negative: "#e44",
  zero: "#888",
};

export default function StoreIslandB() {
  const count = useStore($count);
  const doubled = useStore($doubled);
  const label = useStore($label);

  return (
    <div style={s.box}>
      <div style={s.label}>Island B — Derived State</div>
      <div style={s.row}>
        <div style={s.cell}>
          <span style={s.key}>$count</span>
          <span style={s.val}>{count}</span>
        </div>
        <div style={s.cell}>
          <span style={s.key}>$doubled</span>
          <span style={s.val}>{doubled}</span>
        </div>
      </div>
      <div style={{ ...s.badge, background: labelColors[label] }}>{label}</div>
      <p style={s.note}>Reads <code>$count</code> + <code>$doubled</code> (computed). No buttons here — purely reactive. Separate React root from Island A.</p>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  box: { border: "2px solid #4ab", borderRadius: 12, padding: 20, background: "#f0faff", fontFamily: "system-ui, sans-serif" },
  label: { fontSize: 11, fontWeight: "bold", color: "#4ab", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 },
  row: { display: "flex", gap: 12, marginBottom: 12 },
  cell: { flex: 1, background: "#d8f0ff", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  key: { fontSize: 11, fontFamily: "monospace", color: "#4ab" },
  val: { fontSize: 32, fontWeight: "bold", color: "#1a5a8a" },
  badge: { display: "inline-block", color: "white", fontWeight: "bold", fontSize: 12, padding: "3px 12px", borderRadius: 12, marginBottom: 12, transition: "background 0.3s" },
  note: { fontSize: 12, color: "#666", margin: 0, lineHeight: 1.5 },
};
