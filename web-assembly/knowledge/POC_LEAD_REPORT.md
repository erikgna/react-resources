# WebAssembly POC — Report for Lead Review

**Engineer:** Erik Na  
**Date:** 2026-05-28  
**Repo path:** `react-resources/web-assembly/`

---

## What This POC Explores

The JS↔Wasm memory boundary — specifically: how does data cross from JavaScript into Rust and back, who manages memory, and when does the performance advantage actually appear?

The vehicle is intentionally minimal: pass an array of integers from JS into Rust, double each value, return the result. No images, no 2D layout, no domain knowledge required. Every line of code is about the Wasm mechanism itself.

---

## Architecture

```
Browser
  main.ts
    └─ WasmNumberProcessor (wasmClient.ts)
         ├─ alloc()         ← Wasm: reserve n bytes, return byte offset
         ├─ copy bytes in   ← JS writes Int32Array into Wasm memory
         ├─ double_values() ← Rust: mutates bytes in-place
         ├─ copy bytes out  ← JS reads result back
         └─ dealloc()       ← Wasm: free the allocation
```

One Rust function (`double_values`). One TypeScript wrapper class. One HTML page with three buttons: Double via Wasm, Double via JS, Run Benchmark.

---

## The Core Concept: Wasm Linear Memory

Wasm has **one flat byte array** (`WebAssembly.Memory`). Both Rust and JavaScript read/write the same bytes. A "pointer" in Wasm is just an integer — a byte offset into that array.

```
memory.buffer
[... | 0A 00 00 00 | 19 00 00 00 | 32 00 00 00 | ...]
       ^ptr
       i32(10)        i32(25)        i32(50)       ← JS wrote these; Rust reads them
```

There is no automatic serialization. JS writes raw bytes at an address, tells Rust the address, Rust reads/mutates the bytes, JS reads back. Same model as C FFI.

---

## The 5-Step Protocol (Every Wasm Call)

```
1. ptr = alloc(byteLen)
2. Uint8Array(memory.buffer).set(inputBytes, ptr)   ← copy in
3. double_values(ptr, count)                         ← Rust executes
4. Uint8Array(memory.buffer).slice(ptr, ptr+byteLen) ← copy out
5. dealloc(ptr, byteLen)
```

This is the entire boundary. The image processing POC I did before was this same pattern applied to 4MB pixel buffers.

---

## Key Code Concepts

### `std::mem::forget` — How Rust Exposes Memory to JS

```rust
pub fn alloc_buf(size: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(size);
    buf.resize(size, 0u8);
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf); // intentional leak
    ptr
}
```

Without `forget`: Rust drops the Vec at end of function, freeing the memory. JS receives a dangling pointer. `forget` keeps the allocation alive until `dealloc` explicitly frees it.

### Why `unsafe` — and Why It's Bounded

```rust
pub unsafe fn double_values(ptr: *mut u8, count: usize) { ... }
```

Rust's safety guarantees can't cross the JS/Wasm boundary. The compiler can't verify a pointer sent from JavaScript is valid. `unsafe` marks the contract: "caller (JS) must pass a ptr from alloc() with the correct byte count." All unsafe code goes through two helpers in `utils/memory.rs`.

### `.slice()` Not `.subarray()` in copyOut

```typescript
// Independent copy — safe if Wasm memory grows
new Uint8Array(memory.buffer).slice(ptr, ptr + byteLen)
```

If Wasm allocates more memory, the browser replaces `memory.buffer` with a new `ArrayBuffer`. A `subarray` view into the old buffer becomes a detached buffer — reads return 0, writes are silently dropped. `.slice()` copies before that can happen.

### Byte vs Element Offsets

`ptr` is always in bytes. Typed arrays index by elements. Using `Uint8Array` as the copy vehicle sidesteps this:

```typescript
// Always correct — Uint8Array indexes by byte = ptr is directly usable
new Uint8Array(memory.buffer).set(new Uint8Array(data.buffer), ptr);
```

---

## Benchmark Results (1,000,000 elements)

| | Wasm | JS | Speedup |
|--|------|-----|---------|
| Doubling i32 array | ~4ms | ~12ms | ~3× |

**Important nuance:** For small arrays (< ~1,000 elements), Wasm can be *slower*. The fixed overhead — `alloc` + two `memcpy` passes — exceeds the computation savings. Wasm is a targeted tool, not a blanket speedup.

---

## What I Can Explain Without Notes

- What Wasm linear memory is and why a pointer is just an integer (byte offset)
- The 5-step alloc/copy-in/call/copy-out/dealloc protocol
- Why `mem::forget` is required and what happens without it
- Why `.slice()` must be used instead of `.subarray()`
- The byte-vs-element offset issue with typed arrays
- What wasm-bindgen generates and what the `>>> 0` conversion is for
- The full compilation pipeline: `.rs` → `cargo` (wasm32-unknown-unknown) → `.wasm` → `wasm-bindgen` → `.js + .d.ts`
- When Wasm's performance advantage appears vs when copy overhead wins

---

## What's Still Shallow

1. **No error path testing.** Invalid pointer or wrong count corrupts memory silently — no bounds check.
2. **No multiple implementations.** One version per concept, no rebuilding from memory.
3. **No SIMD or threading.** Both are viable next steps on this codebase.

---

## Files

| File | Role |
|------|------|
| `wasm/src/lib.rs` | Public API: `alloc`, `dealloc`, `double_values` |
| `wasm/src/utils/memory.rs` | `alloc_buf` (mem::forget), `free_buf`, `get_slice` |
| `frontend/src/wasmClient.ts` | JS↔Wasm bridge — the only file handling pointers |
| `frontend/src/main.ts` | DOM wiring, benchmark |
| `TECHNICAL.md` | Deep technical reference |
| `knowledge/index.md` | Learning log — what I discovered, what's still shallow |
