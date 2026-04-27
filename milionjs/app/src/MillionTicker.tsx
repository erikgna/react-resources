import { useState, useRef, useEffect } from "react";
import { block } from "million/react";

const TickerInner = block(
  ({ value, color }: { value: number; color: string }) => {
    return (
      <div
        style={{
          backgroundColor: color,
          padding: "20px",
          borderRadius: "12px",
          color: "#fff",
          fontFamily: "monospace",
          textAlign: "center",
          fontSize: "24px",
          border: "4px solid rgba(255,255,255,0.2)",
        }}
      >
        VALUE: {value.toFixed(4)}
      </div>
    );
  },
);

export default function MillionStressTest() {
  const [val, setVal] = useState(0);
  const [col, setCol] = useState("#4a4");
  const [isRunning, setIsRunning] = useState(false);

  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isRunning) return;

    let running = true;

    const tick = () => {
      if (!running) return;

      setVal(Math.random());
      setCol(`rgb(74, ${Math.floor(Math.random() * 155) + 100}, 74)`);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [isRunning]);

  return (
    <div style={{ padding: "20px", maxWidth: "400px" }}>
      <button
        onClick={() => setIsRunning((v) => !v)}
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: "20px",
          borderRadius: "8px",
          border: "none",
          background: isRunning ? "#ff4d4d" : "#4a4",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        {isRunning ? "STOP" : "START 60FPS LOOP"}
      </button>

      <TickerInner key={val} value={val} color={col} />
    </div>
  );
}
