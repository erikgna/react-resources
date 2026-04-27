import { useState } from "react";
import MillionList from "./MillionList";
import ReactList from "./ReactList";

type Mode = "react" | "million";

export default function List() {
  const [mode, setMode] = useState<Mode>("react");

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setMode("react")}
          style={btn(mode === "react", "#e44")}
        >
          React
        </button>
        <button
          onClick={() => setMode("million")}
          style={btn(mode === "million", "#4a4")}
        >
          Million.js
        </button>
      </div>
      {mode === "react" ? <ReactList /> : <MillionList />}
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
