# WebAssembly Image Processing POC — Implementation Plan

## Context

Build a Rust→Wasm image processing app demonstrating: linear memory, JS↔Wasm interop, convolution filters, and benchmark against pure JS. Clean slate — only design docs exist. `wasm-pack` not installed; `wasm32-unknown-unknown` target not added yet.

---

## Prerequisites (run once before build)

```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
```

---

## Project Structure

```
web-assembly/
 ├── wasm/                   # Rust crate
 │    ├── Cargo.toml
 │    └── src/
 │         ├── lib.rs
 │         ├── filters/
 │         │    ├── mod.rs
 │         │    ├── grayscale.rs
 │         │    ├── blur.rs
 │         │    ├── edge.rs
 │         │    └── resize.rs
 │         └── utils/
 │              ├── mod.rs
 │              └── memory.rs
 │
 ├── frontend/               # Vite + TypeScript
 │    ├── index.html
 │    ├── package.json
 │    ├── vite.config.ts
 │    └── src/
 │         ├── main.ts
 │         ├── upload.ts
 │         ├── canvas.ts
 │         ├── wasmClient.ts  # WasmImageProcessor wrapper class
 │         └── benchmark.ts
 │
 └── README.md
```

---

## Phase 1 — Rust Wasm Crate

### `wasm/Cargo.toml`
- crate-type: `["cdylib", "rlib"]`
- deps: `wasm-bindgen = "0.2"`, `getrandom = { features = ["js"] }`
- features: no `std` not needed; keep std

### Exported API (`lib.rs` via `wasm-bindgen`)

| fn | signature | notes |
|----|-----------|-------|
| `alloc` | `(size: usize) -> *mut u8` | Vec::leak allocator |
| `dealloc` | `(ptr: *mut u8, size: usize)` | rebuild Vec and drop |
| `grayscale` | `(ptr: *mut u8, len: usize)` | in-place RGBA |
| `blur` | `(ptr: *mut u8, width: u32, height: u32)` | box blur 3×3, temp buf |
| `edge_detect` | `(ptr: *mut u8, width: u32, height: u32)` | Sobel operator |
| `resize` | `(ptr: *mut u8, src_w: u32, src_h: u32, dst_w: u32, dst_h: u32) -> *mut u8` | returns new ptr, bilinear |

### Filters

**grayscale.rs**: `gray = 0.3R + 0.59G + 0.11B`, set R=G=B=gray, A unchanged

**blur.rs**: 3×3 box blur, allocate temp buffer, clamp edges

**edge.rs**: Sobel X/Y kernels, `magnitude = sqrt(gx²+gy²).min(255)`

**resize.rs**: bilinear interpolation; returns pointer to new heap buffer (caller owns)

**memory.rs**: `alloc`/`dealloc` helpers using `Vec<u8>`

---

## Phase 2 — Frontend (Vite + TypeScript)

### `wasmClient.ts` — `WasmImageProcessor` class

```ts
class WasmImageProcessor {
  private wasm: any;

  async init(): Promise<void>   // import() wasm-pack output
  grayscale(data: Uint8ClampedArray, w: number, h: number): Uint8ClampedArray
  blur(data: Uint8ClampedArray, w: number, h: number): Uint8ClampedArray
  edgeDetect(data: Uint8ClampedArray, w: number, h: number): Uint8ClampedArray
  resize(data: Uint8ClampedArray, sw: number, sh: number, dw: number, dh: number): Uint8ClampedArray

  private copyToWasm(data: Uint8ClampedArray): number   // returns ptr
  private copyFromWasm(ptr: number, len: number): Uint8ClampedArray
  private free(ptr: number, len: number): void
}
```

Memory contract: alloc → copy in → call → copy out → dealloc. Never hold ptr across calls.

### `canvas.ts`
- `loadImage(file: File): Promise<ImageData>` — draws to offscreen canvas, extracts ImageData
- `renderResult(ctx: CanvasRenderingContext2D, data: Uint8ClampedArray, w: number, h: number)`

### `benchmark.ts`
- `runBenchmark(filter: FilterName, data: ImageData, wasmProcessor: WasmImageProcessor)`
- Runs Wasm version N=5 times, JS version N=5 times, reports avg ms each
- JS fallback implementations: grayscale + blur in pure TS

### `main.ts`
- Wire file input → canvas load → filter buttons → display result + benchmark table

### `index.html`
- File input, canvas (original + processed side-by-side)
- Filter buttons: Grayscale | Blur | Edge Detect
- Benchmark results table

---

## Phase 3 — Build Pipeline

### Build Wasm

```bash
cd wasm
wasm-pack build --target web --out-dir ../frontend/src/wasm-pkg
```

### Vite config

```ts
// vite.config.ts
export default defineConfig({
  server: { headers: { 'Cross-Origin-Opener-Policy': 'same-origin' } },
  optimizeDeps: { exclude: ['wasm-pkg'] },
})
```

### `package.json` deps
- `vite`, `typescript`

---

## Critical Files to Create

1. `wasm/Cargo.toml`
2. `wasm/src/lib.rs`
3. `wasm/src/filters/{mod,grayscale,blur,edge,resize}.rs`
4. `wasm/src/utils/{mod,memory}.rs`
5. `frontend/package.json`
6. `frontend/vite.config.ts`
7. `frontend/index.html`
8. `frontend/src/main.ts`
9. `frontend/src/wasmClient.ts`
10. `frontend/src/canvas.ts`
11. `frontend/src/benchmark.ts`

---

## Verification

1. `rustup target add wasm32-unknown-unknown && cargo install wasm-pack`
2. `cd wasm && wasm-pack build --target web --out-dir ../frontend/src/wasm-pkg` → no errors
3. `cd frontend && npm install && npm run dev`
4. Upload JPEG/PNG → apply each filter → image updates on canvas
5. Benchmark table shows Wasm ms vs JS ms (Wasm should win on blur/edge for large images)
6. Chrome DevTools → no console errors, no memory leaks (check ptr dealloc)

---

## Deferred (out of scope for POC)

- SIMD (`std::arch` / `packed_simd`)
- Web Workers + SharedArrayBuffer
- Streaming Wasm compilation
- Histogram panel
