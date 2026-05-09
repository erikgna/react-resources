import { useState } from "react";

export default function ReactCounter() {
  const [count, setCount] = useState(0);

  return (
    <div style={styles.box}>
      <h4 style={styles.title}>React Island Counter</h4>
      <p style={styles.badge}>client:load — Fully Interactive</p>
      <div style={styles.display}>{count}</div>
      <div style={styles.buttons}>
        <button style={styles.btn} onClick={() => setCount((c) => c - 1)}>
          -
        </button>
        <button style={styles.btn} onClick={() => setCount((c) => c + 1)}>
          +
        </button>
      </div>
      <p style={styles.note}>
        This React component is an "island" — hydrated with{" "}
        <code>client:load</code>. Full React with hooks, state, and event
        handlers. JS bundle ships to the browser for this component only.
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  box: {
    border: "2px solid #4a4",
    borderRadius: 12,
    padding: 24,
    maxWidth: 320,
    fontFamily: "system-ui, sans-serif",
    background: "#f0fff0",
  },
  title: { margin: "0 0 8px", fontSize: 16, color: "#2a2" },
  badge: {
    display: "inline-block",
    background: "#4a4",
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
    padding: "2px 8px",
    borderRadius: 4,
    margin: "0 0 16px",
  },
  display: {
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
    padding: 16,
    background: "#c8f0c8",
    borderRadius: 8,
    marginBottom: 12,
    color: "#1a5a1a",
  },
  buttons: {
    display: "flex",
    gap: 8,
    justifyContent: "center",
    marginBottom: 12,
  },
  btn: {
    fontSize: 24,
    width: 52,
    height: 52,
    borderRadius: 8,
    border: "2px solid #4a4",
    background: "#4a4",
    color: "white",
    cursor: "pointer",
  },
  note: { fontSize: 12, color: "#555", margin: 0, lineHeight: 1.5 },
};
