# WebAssembly Array Doubling POC — Technical Reference

## What This Is

A minimal browser app that passes an array of integers from JavaScript into Rust (compiled to Wasm), doubles each value, and reads the result back.

The purpose: learn the JS↔Wasm memory protocol in isolation — no image domain, no 2D layout, no convolution math. Just the boundary itself.

---

## The Core Concept: Wasm Linear Memory

Wasm has **one flat byte array** called linear memory (`WebAssembly.Memory`). Both JS and Rust look at the exact same bytes.

```
WebAssembly.Memory.buffer (ArrayBuffer — one contiguous byte array)
┌─────────────────────────────────────────────────┐
│  Rust heap / allocator metadata  │  your data   │
│                                  │  [i32, i32…] │
└─────────────────────────────────────────────────┘
                                    ^
                                   ptr (just an integer: byte offset)
```

A "pointer" in Wasm is **not a reference** — it's an integer. `ptr = 1024` means "start at byte 1024 of the memory array." JavaScript reads and writes there directly with `new Uint8Array(memory.buffer).set(data, ptr)`.

---

## The Memory Protocol (Every Wasm Call Follows This)

```
1. ptr = alloc(byteLength)
        Rust allocates space, returns byte offset as integer.

2. new Uint8Array(memory.buffer).set(inputBytes, ptr)
        JS writes input data into Wasm memory at that offset.

3. double_values(ptr, count)
        Rust reads count×4 bytes from ptr, doubles each i32, writes back.

4. new Uint8Array(memory.buffer).slice(ptr, ptr + byteLength)
        JS reads the result out (slice = independent copy, not a view).

5. dealloc(ptr, byteLength)
        Rust reconstructs and drops the Vec to actually free.
```

This 5-step pattern is the entire JS↔Wasm boundary. The image processing version of this POC was just this same pattern applied to pixel buffers.

---

## Rust Side: `wasm/`

### Cargo.toml

```toml
crate-type = ["cdylib", "rlib"]
```

- `cdylib` — produces the `.wasm` binary (dynamic library for JS to consume)
- `rlib` — Rust library format needed by wasm-bindgen tooling

```toml
[profile.release]
opt-level = 3
lto = true
```

`lto = true` (link-time optimization) lets the compiler eliminate dead code across crates — important for keeping the `.wasm` binary small.

### lib.rs — The Public API

```rust
#[wasm_bindgen]
pub fn alloc(size: usize) -> *mut u8
```

`size` is in bytes. Returns an integer (byte offset). JavaScript calls this to reserve space before writing data.

```rust
#[wasm_bindgen]
pub unsafe fn dealloc(ptr: *mut u8, size: usize)
```

`unsafe` because Rust cannot verify the pointer came from a valid allocation. If JS passes a wrong ptr or size, memory corrupts silently — no bounds check, no error. This is unavoidable at the Wasm/FFI boundary.

```rust
#[wasm_bindgen]
pub unsafe fn double_values(ptr: *mut u8, count: usize)
```

Reads `count × 4` bytes from `ptr` as little-endian i32 values, doubles each, writes back.

### utils/memory.rs — Raw Memory Primitives

```rust
pub fn alloc_buf(size: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(size);
    buf.resize(size, 0u8);
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf); // intentional leak
    ptr
}
```

`std::mem::forget` is the critical non-obvious step. Without it:
- `buf` goes out of scope at end of function
- Rust's destructor runs → Vec is freed → memory is gone
- JavaScript receives a pointer to freed memory (dangling pointer)

`forget` prevents the destructor from running. The memory stays live until `dealloc` is called explicitly.

```rust
pub unsafe fn free_buf(ptr: *mut u8, size: usize) {
    drop(Vec::from_raw_parts(ptr, size, size));
}
```

Reconstructs the Vec from the same pointer+length to trigger the destructor and actually free.

### Why `from_le_bytes` Instead of Pointer Cast

```rust
// NOT this — Vec<u8> has alignment 1, casting to *mut i32 is UB if ptr isn't 4-aligned
let data = std::slice::from_raw_parts_mut(ptr as *mut i32, count);

// This — safe regardless of alignment
let val = i32::from_le_bytes([bytes[off], bytes[off+1], bytes[off+2], bytes[off+3]]);
```

Wasm is always little-endian (mandated by spec), so `from_le_bytes` is correct on all platforms.

---

## TypeScript Side: `frontend/src/`

### wasmClient.ts — WasmNumberProcessor

The only file that knows about Wasm. Everything else is plain TypeScript.

**copyIn:**
```typescript
private copyIn(data: Int32Array): number {
    const ptr = alloc(data.byteLength);          // bytes, not elements
    new Uint8Array(memory.buffer).set(           // always use Uint8Array for raw byte copies
        new Uint8Array(data.buffer), ptr
    );
    return ptr;
}
```

`data.byteLength` = `data.length × 4`. The `Uint8Array` view wraps the same `ArrayBuffer` without copying — it just changes how we index the bytes.

**copyOut:**
```typescript
private copyOut(ptr: number, byteLen: number): Int32Array {
    const bytes = new Uint8Array(memory.buffer).slice(ptr, ptr + byteLen);
    return new Int32Array(bytes.buffer);
}
```

`.slice()` is required — not `.subarray()`. Wasm memory can grow (browser replaces the `ArrayBuffer`). A `subarray` view into the old buffer becomes a **detached buffer** — reads return 0, writes are silently dropped. `.slice()` creates an independent copy before returning.

### main.ts

Wires three buttons:
- **Double via Wasm** — calls `wasm.doubleArray()`, full 5-step protocol
- **Double via JS** — plain JS loop, same output, no Wasm
- **Benchmark** — runs both on 1,000,000 elements, reports ms and speedup

---

## Build System

### Compiling Rust to Wasm

```bash
cd wasm/
wasm-pack build --target web
# output → wasm/pkg/  (copy to frontend/src/wasm-pkg/)
```

`wasm-pack` orchestrates:
1. `cargo build --target wasm32-unknown-unknown --release`
2. `wasm-bindgen` — generates `wasm_image.js` glue and `wasm_image.d.ts` types
3. `wasm-opt` — shrinks and optimizes the `.wasm` binary

### Dev Server

```bash
cd frontend/
npm install
npm run dev
```

Vite config sets `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers — required for `SharedArrayBuffer` access (future threading support).

`optimizeDeps: { exclude: ["wasm-image"] }` tells Vite not to pre-bundle the Wasm package. The `.wasm` binary is loaded at runtime via `fetch()` inside `init()`, not statically bundled.

---

## Data Flow End-to-End

```
User types: "10, 25, 50"
        │
        ▼
main.ts: parseInt each → Int32Array([10, 25, 50])
        │
        ▼
wasmClient.doubleArray(data)
        │
        ├─ alloc(12)                       → ptr  (3 elements × 4 bytes)
        ├─ Uint8Array(memory.buffer).set(  ← copy 12 bytes into Wasm memory at ptr
        │      Uint8Array(data.buffer), ptr)
        ├─ double_values(ptr, 3)           ← Rust: reads 3 i32s, doubles, writes back
        ├─ Uint8Array(memory.buffer)       ← read 12 bytes back out
        │      .slice(ptr, ptr + 12)
        │      → new Int32Array(...)       = Int32Array([20, 50, 100])
        └─ dealloc(ptr, 12)               ← Rust frees the allocation
        │
        ▼
main.ts: display "20, 50, 100"
```

---

## Performance Notes

On 1,000,000 elements:
- Wasm is typically **2–5× faster** than the equivalent JS loop
- For small arrays (< ~1,000 elements), Wasm can be *slower* — the fixed overhead of `alloc` + two `memcpy` operations (in and out) exceeds the computation savings
- This crossover point is where Wasm's advantage begins: when computation cost dominates copy cost

---

## File Reference

| File | Role |
|------|------|
| `wasm/Cargo.toml` | Rust crate config, wasm-bindgen dep, release profile |
| `wasm/src/lib.rs` | Public API: `alloc`, `dealloc`, `double_values` |
| `wasm/src/utils/memory.rs` | `alloc_buf` (mem::forget), `free_buf`, `get_slice` |
| `frontend/src/wasmClient.ts` | JS↔Wasm bridge: copyIn, copyOut, doubleArray |
| `frontend/src/main.ts` | DOM wiring, benchmark runner |
| `frontend/src/wasm-pkg/` | Generated by wasm-pack — do not edit by hand |
| `frontend/vite.config.ts` | COEP/COOP headers, Wasm excluded from bundler |
