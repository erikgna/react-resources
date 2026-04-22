# WebAssembly Image Processing POC — Technical Documentation

## What This Is

A browser app that processes images using Rust compiled to WebAssembly. Pixel data flows from the browser's Canvas API into Wasm linear memory, Rust mutates it, and the result flows back to the canvas.

The point: demonstrate that CPU-heavy work (convolution filters, edge detection) can run near-native speed in the browser by compiling Rust to Wasm instead of doing it in JavaScript.

---

## The Core Idea: How Wasm Works in a Browser

WebAssembly is a binary instruction format that browsers execute directly — not interpreted like JavaScript, but compiled to machine code by the browser's JIT compiler at load time.

Key constraints:
- Wasm cannot touch the DOM
- Wasm cannot call browser APIs
- Wasm has its own isolated memory (a linear byte array)
- JavaScript calls Wasm functions and vice versa via a bridge

So the architecture is always: **JS does UI + orchestration, Wasm does computation**.

---

## The Compilation Pipeline

```
Rust source (.rs)
      │
      ▼
  cargo (Rust compiler)
      │  target: wasm32-unknown-unknown
      ▼
WebAssembly binary (.wasm)
      │
      ▼
  wasm-bindgen (post-processor)
      │
      ▼
.wasm + .js glue file (wasm_image.js)
      │
      ▼
Browser loads both, calls Rust functions as if they were JS functions
```

### wasm32-unknown-unknown

The Rust compilation target. `wasm32` = 32-bit WebAssembly address space. `unknown-unknown` = no OS, no standard library OS abstractions. The binary will run inside a browser sandbox with no filesystem, no threads (by default), no system calls.

### wasm-pack

Orchestrates the compilation:
1. Runs `cargo build --target wasm32-unknown-unknown --release`
2. Runs `wasm-bindgen` to generate the JS glue layer
3. Runs `wasm-opt` to shrink and optimize the `.wasm` binary
4. Outputs a package directory (`wasm-pkg/`) ready to import

### wasm-bindgen

The bridge generator. It reads `#[wasm_bindgen]` annotations in Rust source and generates:
- Type-safe JavaScript wrapper functions
- TypeScript `.d.ts` declaration files
- Memory marshaling code

Without it, calling a Wasm function from JS requires passing raw memory pointers manually. wasm-bindgen makes `grayscale(ptr, len)` callable as a typed JS function.

---

## Memory Model (Most Important Concept)

Wasm has **linear memory**: a single flat array of bytes (`WebAssembly.Memory`). Both Rust and JavaScript can read/write this same array.

```
WebAssembly.Memory.buffer (ArrayBuffer)
┌────────────────────────────────────────────┐
│  allocator metadata  │  image buffer (RGBA) │
│  (Rust heap)         │  [R,G,B,A,R,G,B,A…] │
└────────────────────────────────────────────┘
         ↑                       ↑
   Rust manages this        JS writes pixel data here,
   via Vec/Box              Rust reads/mutates it
```

A `ptr: *mut u8` is just an integer — an offset into this array. When Rust receives `ptr = 1024`, it means "start reading at byte 1024 of Wasm memory."

JavaScript can view the same memory:
```js
const mem = new Uint8Array(wasmInstance.memory.buffer);
mem.set(pixelData, ptr); // write into Wasm memory at offset `ptr`
```

This is zero-copy across the boundary — both sides look at the same bytes.

### Why This Matters for Images

A 1000×1000 RGBA image = 4,000,000 bytes. Copying that between JS and Wasm on every filter call is expensive. The design avoids unnecessary copies by:
1. Allocating a buffer inside Wasm memory
2. Copying pixel data in once
3. Rust mutates in-place
4. JS reads the result directly from the same memory region

---

## Rust Crate: `wasm/`

### Cargo.toml

```toml
crate-type = ["cdylib", "rlib"]
```

- `cdylib` — produces a `.wasm` file (dynamic library for consumption by external code)
- `rlib` — produces a Rust library (needed for `wasm-bindgen` to work)

### lib.rs — Public API

Every function tagged `#[wasm_bindgen]` becomes callable from JavaScript.

```rust
#[wasm_bindgen]
pub fn alloc(size: usize) -> *mut u8
```

Returns a pointer (integer) to a freshly allocated region of Wasm memory. JavaScript uses this pointer to know where to write pixel data.

```rust
#[wasm_bindgen]
pub unsafe fn dealloc(ptr: *mut u8, size: usize)
```

Frees the allocation. `unsafe` because raw pointer arithmetic — if `ptr` or `size` are wrong, this corrupts memory. Callers are responsible for passing valid values.

```rust
#[wasm_bindgen]
pub unsafe fn grayscale(ptr: *mut u8, len: usize)
```

`ptr` = start of RGBA pixel buffer in Wasm memory. `len` = total bytes. Rust reconstructs a `&mut [u8]` slice from these and applies the grayscale formula in-place.

```rust
#[wasm_bindgen]
pub unsafe fn resize(...) -> *mut u8
```

Unlike other filters, resize changes dimensions, so it cannot mutate in-place. It allocates a new buffer, writes the resized pixels there, and returns its pointer. JavaScript is responsible for freeing both the input and output pointers.

### utils/memory.rs

```rust
pub unsafe fn get_slice<'a>(ptr: *mut u8, len: usize) -> &'a mut [u8] {
    std::slice::from_raw_parts_mut(ptr, len)
}
```

Turns a raw pointer + length into a Rust slice. The `unsafe` block is required because Rust cannot verify the pointer is valid — it trusts the caller (JavaScript) to provide correct values. The `'a` lifetime is unconstrained (essentially `'static`) because Wasm memory lives for the entire program duration.

```rust
pub fn alloc_buf(size: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(size);
    buf.resize(size, 0u8);
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);  // ← critical
    ptr
}
```

`std::mem::forget` prevents Rust from dropping (freeing) the `Vec` when it goes out of scope. This "leaks" the allocation intentionally — the memory stays alive until `dealloc` is called explicitly. Without `forget`, Rust would free the memory at end of function, leaving JavaScript with a dangling pointer.

### filters/grayscale.rs

```rust
let gray = (0.3 * r + 0.59 * g + 0.11 * b) as u8;
data[i] = gray;
data[i + 1] = gray;
data[i + 2] = gray;
// data[i + 3] (alpha) untouched
```

Luminance formula (ITU-R BT.601). Human eyes are most sensitive to green (~59%), less to red (~30%), least to blue (~11%). This produces perceptually accurate grayscale rather than a flat average.

### filters/blur.rs

3×3 box blur. For each pixel, average its color with the 8 surrounding pixels (up to 9 total, fewer at edges).

```
[ ][x][ ]
[x][P][x]    ← P = pixel being computed, x = neighbors included in average
[ ][x][ ]
```

Clamps to image boundaries (no wrap-around). The `data.to_vec()` at the start creates a copy of the original pixels — required because we're writing new values while still reading old neighbor values. Without this, a pixel computed earlier in the loop would contaminate later calculations.

### filters/edge.rs

Sobel operator. Detects edges by measuring how fast pixel intensity changes across X and Y axes.

Two 3×3 convolution kernels:

```
Kx (horizontal change):    Ky (vertical change):
-1  0  1                   -1 -2 -1
-2  0  2                    0  0  0
-1  0  1                    1  2  1
```

For each pixel, compute the intensity gradient:
```
gx = sum of (Kx[i][j] * grayscale_value_of_neighbor)
gy = sum of (Ky[i][j] * grayscale_value_of_neighbor)
magnitude = sqrt(gx² + gy²), clamped to 255
```

High magnitude = rapid intensity change = edge. Near-zero = flat region.

### filters/resize.rs

Bilinear interpolation. When downscaling 1000px → 500px, each output pixel maps to a non-integer position in the source (e.g., output pixel 3 comes from source position 6.0, output pixel 4 from 8.0 — but a fractional output like 7.5 falls between two source pixels).

Bilinear interpolation blends the four surrounding pixels weighted by distance:

```
source pixel positions:
  (x0,y0)──────(x1,y0)
     │              │
     │   (sx,sy)    │    ← fractional source position
     │              │
  (x0,y1)──────(x1,y1)

result = tl*(1-xf)*(1-yf) + tr*xf*(1-yf)
       + bl*(1-xf)*yf     + br*xf*yf
```

`xf`/`yf` = fractional part of the source position. Smoother than nearest-neighbor (which just snaps to the closest pixel).

---

## JavaScript / TypeScript Layer: `frontend/src/`

### wasmClient.ts — WasmImageProcessor

The only file that knows about Wasm. Everything else calls its typed methods.

```ts
import init, { alloc, dealloc, grayscale, ... } from "./wasm-pkg/wasm_image.js";

const exports = await init();
memory = exports.memory;
```

`init()` (wasm-bindgen's generated default export) fetches and instantiates the `.wasm` binary. It returns the raw WebAssembly exports object, which includes `memory`. The named exports (`alloc`, `grayscale`, etc.) are thin JS wrappers generated by wasm-bindgen.

**Memory flow for a filter call:**

```
1. alloc(data.length)          → ptr  (integer: byte offset in Wasm memory)
2. new Uint8Array(memory.buffer).set(data, ptr)   ← copy pixels into Wasm
3. grayscale(ptr, data.length)                    ← Rust mutates in-place
4. new Uint8ClampedArray(...buffer...).slice(ptr, ptr + len)  ← copy result out
5. dealloc(ptr, data.length)                      ← free the allocation
```

Step 4 uses `.slice()` (not `.subarray()`) to create an independent copy. If we used `subarray`, the returned typed array would be a view into `memory.buffer`. That buffer can be invalidated if Wasm allocates more memory (the underlying ArrayBuffer is replaced when Wasm memory grows), leaving the caller with a dangling view.

### canvas.ts

```ts
export async function loadImageData(file: File): Promise<ImageData>
```

Creates an offscreen `<canvas>`, draws the image onto it, then calls `getImageData()` which returns a `Uint8ClampedArray` of RGBA bytes — exactly the format Rust expects.

```ts
export function renderToCanvas(canvas, data, width, height)
```

Wraps the pixel array back into an `ImageData` object and calls `putImageData()`. This is the only way to write raw pixels back to a canvas.

### benchmark.ts

Runs each filter `N=3` times for both Wasm and pure-JS implementations, reports average milliseconds. The JS implementations mirror the Rust logic exactly (same grayscale formula, same 3×3 box blur, same Sobel operator) so the comparison is fair.

`performance.now()` gives sub-millisecond precision. For small images Wasm may be slower due to copy overhead — the performance advantage appears on larger images (>500×500) where computation cost dominates the copy cost.

### main.ts

Wires DOM events to filter calls. Benchmark results are prepended (newest first) to a table.

---

## Build System: Vite

Vite is the dev server and bundler for the frontend. Critical config:

```ts
server: {
  headers: {
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
  }
}
```

These headers enable `SharedArrayBuffer`, required for future `Atomics`-based threading. Without them, certain browser features are locked. They're set now for forward compatibility.

```ts
optimizeDeps: { exclude: ["wasm-image"] }
```

Tells Vite not to pre-bundle the Wasm package. Wasm is loaded at runtime via `fetch()` (inside `init()`), not statically imported, so bundling it would break the load path.

---

## Data Flow End-to-End

```
User uploads image.jpg
        │
        ▼
FileReader / createObjectURL
        │
        ▼
<img> element loads the file
        │
        ▼
Offscreen <canvas>.drawImage(img)     ← composites image onto canvas
        │
        ▼
canvas.getImageData()
→ Uint8ClampedArray [R,G,B,A, R,G,B,A, ...]   ← 4 bytes per pixel, row-major
        │
        ▼
wasmClient.blur(data, width, height)
        │
        ├─ alloc(data.length) → ptr
        ├─ copy data → Wasm memory[ptr]
        ├─ wasm.blur(ptr, width, height)  ← Rust executes
        ├─ copy Wasm memory[ptr..ptr+len] → Uint8ClampedArray
        └─ dealloc(ptr, len)
        │
        ▼
new ImageData(result, width, height)
        │
        ▼
canvas.putImageData(imgData, 0, 0)    ← browser paints pixels
        │
        ▼
User sees filtered image
```

---

## Why unsafe in Rust?

Rust's safety guarantees (ownership, borrowing, lifetimes) cannot be verified across the JS/Wasm boundary. The compiler has no way to know that `ptr` points to valid, properly-sized memory — it has to trust the caller.

The `unsafe` blocks are narrow and controlled:
- `get_slice`: only called with `ptr` + `len` values that were just allocated via `alloc_buf`
- `dealloc`: only called with values the caller received from `alloc`

This is the standard pattern for Wasm/FFI memory management in Rust.

---

## Performance Characteristics

| Image Size | Operation  | Wasm advantage |
|------------|------------|----------------|
| 100×100    | any filter | ≈ neutral or JS faster (copy overhead dominates) |
| 500×500    | grayscale  | Wasm 2–5× faster |
| 500×500    | blur       | Wasm 3–8× faster |
| 500×500    | edge       | Wasm 3–8× faster |
| 1000×1000+ | any filter | Wasm 5–15× faster |

Grayscale is the simplest (O(n) with no neighbor lookups), so speedup is smaller. Blur and edge detection are O(9n) due to the 3×3 kernel, which is where Wasm pulls ahead most — tight loops over raw memory with no GC pressure.

---

## File Reference

| File | Role |
|------|------|
| `wasm/Cargo.toml` | Rust crate config, deps (wasm-bindgen) |
| `wasm/src/lib.rs` | Wasm public API (`#[wasm_bindgen]` exports) |
| `wasm/src/utils/memory.rs` | Raw pointer ↔ slice helpers, alloc/dealloc |
| `wasm/src/filters/grayscale.rs` | Luminance formula, in-place |
| `wasm/src/filters/blur.rs` | 3×3 box blur, temp buffer |
| `wasm/src/filters/edge.rs` | Sobel operator, in-place |
| `wasm/src/filters/resize.rs` | Bilinear interpolation, returns new ptr |
| `frontend/src/wasmClient.ts` | JS↔Wasm bridge: alloc, copy, call, free |
| `frontend/src/canvas.ts` | ImageData load / canvas render |
| `frontend/src/benchmark.ts` | Wasm vs JS timing comparison |
| `frontend/src/main.ts` | DOM wiring, event handlers |
| `frontend/src/wasm-pkg/` | wasm-pack output (do not edit by hand) |
| `frontend/vite.config.ts` | Dev server headers, Wasm exclusion from bundler |
