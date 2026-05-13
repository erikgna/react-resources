import { signal, computed, effect } from "@preact/signals";
import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";

function fib(n: number): number {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}

// ── Section 1: signal + effect (RAF loop) ────────────────────────────────────

function SignalEffectDemo() {
  const value = useSignal(0);
  const color = useSignal("#6366f1");
  const running = useSignal(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const tick = () => {
      if (!running.value) return;
      value.value = Math.random();
      color.value = `hsl(${Math.floor(Math.random() * 360)},70%,45%)`;
      rafRef.current = requestAnimationFrame(tick);
    };

    if (running.value) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
    }

    return () => cancelAnimationFrame(rafRef.current);
  }, [running.value]);

  return (
    <div style="margin-bottom:24px">
      <h4 style="margin:0 0 8px;font-size:13px;color:#6366f1">signal + effect — 60fps loop</h4>
      <button
        onClick={() => { running.value = !running.value; }}
        style={`
          width:100%;padding:10px;margin-bottom:12px;
          border-radius:8px;border:none;
          background:${running.value ? "#dc2626" : "#6366f1"};
          color:#fff;font-weight:bold;cursor:pointer;font-size:13px;
        `}
      >
        {running.value ? "STOP" : "START 60FPS LOOP"}
      </button>
      <div
        style={`
          background:${color.value};
          padding:20px;border-radius:10px;color:#fff;
          font-family:monospace;text-align:center;font-size:24px;
          border:3px solid rgba(255,255,255,0.2);
        `}
      >
        VALUE: {value.value.toFixed(6)}
      </div>
      <p style="font-size:11px;color:#888;margin:6px 0 0;line-height:1.5">
        Only the text node and background-color patch on each frame.
        No component re-render — Preact Signals bypass the VDOM for subscribed DOM nodes.
      </p>
    </div>
  );
}

// ── Section 2: computed (fibonacci + unrelated clock) ────────────────────────

// Module-level signals so computed doesn't re-subscribe on every render
const n = signal(10);
const tick = signal(0);
const fibResult = computed(() => fib(n.value));
let computedRunCount = 0;
effect(() => { fibResult.value; computedRunCount++; });

function ComputedDemo() {
  const _n = useSignal(n.value);
  const _tick = useSignal(tick.value);
  const _runCount = useSignal(computedRunCount);

  useEffect(() => {
    const id = setInterval(() => {
      tick.value++;
      _tick.value = tick.value;
      _runCount.value = computedRunCount;
    }, 1_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style="margin-bottom:24px">
      <h4 style="margin:0 0 8px;font-size:13px;color:#d97706">computed — cached derived state</h4>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <span style="font-size:13px;font-weight:600;white-space:nowrap">N = {_n}</span>
        <input
          type="range"
          min={1}
          max={40}
          value={_n.value}
          onInput={(e) => {
            const v = Number((e.target as HTMLInputElement).value);
            n.value = v;
            _n.value = v;
            _runCount.value = computedRunCount;
          }}
          style="flex:1"
        />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:10px">
        {[
          { label: "fib(N)", val: fibResult.value, color: "#d97706" },
          { label: "computed ran", val: _runCount, color: "#6366f1" },
          { label: "clock ticks", val: _tick, color: "#059669" },
        ].map(({ label, val, color }) => (
          <div key={label} style={`border:2px solid ${color};border-radius:8px;padding:10px;text-align:center`}>
            <div style="font-size:11px;color:#888;margin-bottom:2px">{label}</div>
            <div style={`font-size:20px;font-weight:700;color:${color}`}>{val}</div>
          </div>
        ))}
      </div>
      <p style="font-size:11px;color:#888;margin:0;line-height:1.5">
        Drag slider → "computed ran" increments, fib recalculates.
        Wait → clock ticks but "computed ran" stays frozen.
        <code>computed</code> only tracks its own signal deps.
      </p>
    </div>
  );
}

// ── Section 3: effect cleanup / log ──────────────────────────────────────────

function EffectDemo() {
  const source = useSignal(0);
  const log = useSignal<string[]>([]);

  useEffect(() => {
    const dispose = effect(() => {
      const v = source.value;
      log.value = [`[${new Date().toLocaleTimeString()}] source = ${v}`, ...log.value.slice(0, 7)];
    });
    return dispose;
  }, []);

  return (
    <div>
      <h4 style="margin:0 0 8px;font-size:13px;color:#059669">effect — side effects + cleanup</h4>
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <button
          onClick={() => source.value++}
          style="padding:8px 16px;background:#059669;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600"
        >
          Increment source ({source})
        </button>
      </div>
      <div style="font-family:monospace;font-size:11px;background:#1e1e2e;color:#cdd6f4;padding:10px;border-radius:6px;min-height:80px">
        {log.value.map((line, i) => (
          <div key={i} style={`color:${i === 0 ? "#a6e3a1" : "#888"}`}>{line}</div>
        ))}
        {log.value.length === 0 && <span style="color:#555">click button to trigger effect...</span>}
      </div>
      <p style="font-size:11px;color:#888;margin:6px 0 0;line-height:1.5">
        <code>effect()</code> returns a dispose function. The <code>useEffect</code> cleanup
        calls it — unsubscribes from the signal graph when the component unmounts.
      </p>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function SignalsDemo() {
  return (
    <div style="max-width:520px">
      <SignalEffectDemo />
      <ComputedDemo />
      <EffectDemo />
    </div>
  );
}
