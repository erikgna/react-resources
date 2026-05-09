import { useState, useRef, useEffect } from "react";

interface Props {
  label: string;
  accentColor: string;
}

export default function ReactTicker({ label, accentColor }: Props) {
  const [val, setVal] = useState(0);
  const [col, setCol] = useState(accentColor);
  const [isRunning, setIsRunning] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isRunning) return;
    let active = true;

    const tick = () => {
      if (!active) return;
      setVal(Math.random());
      setCol(
        `rgb(74, ${Math.floor(Math.random() * 155) + 100}, ${Math.floor(Math.random() * 80) + 40})`,
      );
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [isRunning]);

  return (
    <div style={{ padding: 20, maxWidth: 360, fontFamily: "system-ui" }}>
      <h4 style={{ margin: "0 0 12px", color: accentColor, fontSize: 14 }}>
        {label}
      </h4>
      <button
        onClick={() => setIsRunning((v) => !v)}
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 16,
          borderRadius: 8,
          border: "none",
          background: isRunning ? "#ff4d4d" : accentColor,
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        {isRunning ? "STOP" : "START 60FPS LOOP"}
      </button>
      <div
        style={{
          backgroundColor: col,
          padding: 20,
          borderRadius: 12,
          color: "#fff",
          fontFamily: "monospace",
          textAlign: "center",
          fontSize: 24,
          border: "4px solid rgba(255,255,255,0.2)",
          transition: "background-color 0.05s",
        }}
      >
        VALUE: {val.toFixed(4)}
      </div>
    </div>
  );
}
