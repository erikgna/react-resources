import { useState } from "react";
import BlockStressTest from "./Ticker";
import List from "./List";

type Mode = "block" | "for";

export default function App() {
  const [mode, setMode] = useState<Mode>("block");

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setMode("block")}
          style={btn(mode === "block", "#e44")}
        >
          Block
        </button>
        <button
          onClick={() => setMode("for")}
          style={btn(mode === "for", "#4a4")}
        >
          For
        </button>
      </div>
      {mode === "block" ? <BlockStressTest /> : <List />}
    </div>
  );
}

function btn(active: boolean, color: string): React.CSSProperties {
  return {
    padding: "8px 20px",
    border: `2px solid ${color}`,
    borderRadius: 6,
    background: active ? color : "transparent",
    color: active ? "#fff" : color,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  };
}
