import { useState, useRef, useEffect, type FC } from "react";
import { block } from "million/react";

// Type shim: Million v3's block() returns a forwardRef-style component (2-arg signature).
// React 19 tightened JSX.ElementType and rejects that signature, so block(...) used as a
// JSX tag fails tsc with TS2786 (build-only — esbuild/dev ignores types). Casting the
// result to a plain FC with the real prop shape restores type-checking without changing
// runtime behavior. This is a known Million v3 / React 19 interop gap, not a logic bug.
type TickerProps = { value: number; color: string };

// block() is the core Million.js primitive. It takes a React component and returns a
// "Block" — a hyper-optimized version that does NOT go through React's VDOM diff. Instead
// Million compiles the JSX once into a static template, then on each render dirty-checks
// only the dynamic holes (here: `value` and `color`) and patches the exact DOM nodes that
// changed. No tree reconciliation.
//
// Why primitive props matter: the dirty-check is a shallow `Object.is` per prop. It shines
// with strings/numbers/booleans. Pass an object/array and every render looks "changed"
// (new reference), defeating the optimization. This Ticker passes only number + string.
const TickerInner = block(
  ({ value, color }: TickerProps) => {
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
) as unknown as FC<TickerProps>;

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

      {/*
        NO `key` here — this is the single most important line in the Block demo.
        A changing `key` (e.g. key={val}) makes React treat every frame as a brand-new
        element: it unmounts the old Block and mounts a fresh one each tick. That throws
        away Million's in-place dirty-check patch — the exact optimization being measured.
        With a stable identity (no key), Million keeps the same Block and patches only the
        changed text/style nodes.
      */}
      <TickerInner value={val} color={col} />
    </div>
  );
}
