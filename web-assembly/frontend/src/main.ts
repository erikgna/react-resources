import { WasmNumberProcessor } from "./wasmClient.js";

// Single Wasm instance — init() must complete before calling doubleArray().
const wasm = new WasmNumberProcessor();

const inputEl = document.getElementById("input") as HTMLTextAreaElement;
const outputEl = document.getElementById("output")!;
const statusEl = document.getElementById("status")!;
const benchResultEl = document.getElementById("bench-result")!;

async function init() {
  statusEl.textContent = "Loading Wasm...";
  // Fetches and instantiates the .wasm binary. Async because it uses fetch() internally.
  await wasm.init();
  statusEl.textContent = "Ready.";
}

// Parse the textarea into an Int32Array.
function parseInput(): Int32Array | null {
  const parts = inputEl.value.split(",").map(s => parseInt(s.trim(), 10));
  if (parts.some(isNaN)) {
    outputEl.textContent = "Error: enter comma-separated integers";
    return null;
  }
  return new Int32Array(parts);
}

document.getElementById("btn-wasm")!.addEventListener("click", () => {
  const data = parseInput();
  if (!data) return;

  // The full round-trip: JS array → Wasm memory → Rust doubles → back to JS.
  const result = wasm.doubleArray(data);
  outputEl.textContent = Array.from(result).join(", ");
  statusEl.textContent = `Wasm doubled ${data.length} value(s).`;
});

document.getElementById("btn-js")!.addEventListener("click", () => {
  const data = parseInput();
  if (!data) return;

  // Pure JS reference implementation — same operation, no Wasm involved.
  const result = new Int32Array(data.length);
  for (let i = 0; i < data.length; i++) result[i] = data[i] * 2;
  outputEl.textContent = Array.from(result).join(", ");
  statusEl.textContent = `JS doubled ${data.length} value(s).`;
});

document.getElementById("btn-bench")!.addEventListener("click", () => {
  // Benchmark on 1,000,000 elements — large enough that computation cost
  // dominates the fixed copy overhead (alloc + memcpy in + memcpy out).
  const COUNT = 1_000_000;
  const data = new Int32Array(COUNT).fill(42);

  const t0 = performance.now();
  wasm.doubleArray(data);
  const wasmMs = (performance.now() - t0).toFixed(2);

  const t1 = performance.now();
  const jsOut = new Int32Array(COUNT);
  for (let i = 0; i < COUNT; i++) jsOut[i] = data[i] * 2;
  const jsMs = (performance.now() - t1).toFixed(2);

  const speedup = (parseFloat(jsMs) / parseFloat(wasmMs)).toFixed(2);
  benchResultEl.textContent =
    `Wasm: ${wasmMs}ms   JS: ${jsMs}ms   Speedup: ${speedup}×  (n = ${COUNT.toLocaleString()})`;
});

init();
