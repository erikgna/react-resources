# WebAssembly Image Processing POC (Rust) – Architecture Design

## Overview

This project is a Proof of Concept (POC) demonstrating WebAssembly (Wasm) capabilities using Rust for high-performance image processing in the browser.

The application allows users to upload an image and apply filters (blur, grayscale, edge detection, resize), while comparing performance against JavaScript implementations.

---

## Goals

* Demonstrate Rust → Wasm compilation
* Explore JS ↔ Wasm interoperability
* Work with linear memory (pixel buffers)
* Benchmark performance vs JavaScript
* Experiment with SIMD and multithreading (optional extension)

---

## High-Level Architecture

```
[ Browser UI (JS/TS + Canvas) ]
              │
              ▼
[ Wasm Bridge Layer (wasm-bindgen) ]
              │
              ▼
[ Rust Core (Image Processing Engine) ]
              │
              ▼
[ WebAssembly Binary (.wasm) ]
```

---

## Components

### 1. Frontend (JavaScript / TypeScript)

**Responsibilities:**

* Handle file uploads
* Render images using Canvas API
* Pass pixel data to Wasm
* Display processed results
* Run benchmarks

**Key Modules:**

* `upload.ts` – handles file input
* `canvas.ts` – rendering + pixel extraction
* `wasmClient.ts` – Wasm interface wrapper
* `benchmark.ts` – performance comparison logic

---

### 2. Wasm Bridge Layer (wasm-bindgen)

**Responsibilities:**

* Expose Rust functions to JS
* Convert data between JS and Rust
* Manage memory boundaries safely

**Example Exports:**

```rust
#[wasm_bindgen]
pub fn grayscale(ptr: *mut u8, len: usize);

#[wasm_bindgen]
pub fn blur(ptr: *mut u8, width: u32, height: u32);
```

---

### 3. Rust Core (Image Processing Engine)

**Responsibilities:**

* Perform all heavy computations
* Operate directly on pixel buffers
* Optimize for performance

**Structure:**

```
src/
 ├── lib.rs
 ├── filters/
 │    ├── grayscale.rs
 │    ├── blur.rs
 │    ├── edge.rs
 │    └── resize.rs
 ├── utils/
 │    ├── memory.rs
 │    └── math.rs
```

**Key Concepts:**

* Linear memory manipulation
* Unsafe Rust (controlled usage)
* SIMD (optional via `std::arch`)

---

### 4. WebAssembly Module

**Responsibilities:**

* Deliver compiled binary to browser
* Execute near-native performance code

**Build Tooling:**

* `wasm-pack`
* `cargo build --target wasm32-unknown-unknown`

---

## Data Flow

### Image Processing Pipeline

1. User uploads image
2. Image drawn to Canvas
3. Extract `ImageData` (RGBA array)
4. Pass buffer to Wasm
5. Rust processes buffer in-place
6. Return pointer / reuse memory
7. JS updates Canvas with processed data

```
JS (Uint8ClampedArray)
        ↓
Wasm Memory (u8 pointer)
        ↓
Rust Processing
        ↓
Updated Buffer
        ↓
Canvas Render
```

---

## Memory Management Strategy

### Approach: Shared Buffer

* JS allocates `Uint8Array`
* Pass pointer to Wasm
* Rust mutates buffer directly

**Advantages:**

* Avoids unnecessary copies
* Faster execution

**Risks:**

* Unsafe pointer handling
* Requires careful bounds checking

---

## Performance Considerations

### Benchmark Strategy

Compare:

* Pure JavaScript implementation
* Wasm (Rust) implementation

Metrics:

* Execution time (ms)
* Memory usage
* FPS (for repeated operations)

---

## Optional Advanced Features

### SIMD Optimization

* Use Rust SIMD intrinsics
* Improve convolution performance

### Multithreading (Web Workers)

* Split image into chunks
* Process in parallel

### Streaming Compilation

* Load Wasm progressively

### WASI (Future Extension)

* Run image processing outside browser

---

## Project Structure

```
project-root/
 ├── frontend/
 │    ├── index.html
 │    ├── src/
 │    └── vite.config.ts
 │
 ├── wasm/
 │    ├── Cargo.toml
 │    └── src/
 │
 ├── benchmarks/
 │    └── compare.js
 │
 └── README.md
```

---

## Build & Tooling

### Rust

* wasm-pack
* cargo

### Frontend

* Vite or Webpack
* TypeScript (optional)

### Commands

```bash
# Build Wasm
wasm-pack build --target web

# Run frontend
npm run dev
```

---

## Key Learning Outcomes

* Understand Wasm memory model
* Master JS ↔ Rust interop
* Evaluate real performance tradeoffs
* Learn when Wasm is actually beneficial

---

## Risks & Pitfalls

* Serialization overhead can negate performance gains
* DOM operations remain JS-bound
* Debugging Wasm is harder than JS

---

## Future Enhancements

* WebGPU integration for hybrid compute
* Support for video processing
* Plugin-based filter system

---

## JS ↔ Wasm API Design (Detailed)

This section defines how JavaScript communicates with the Rust WebAssembly module, focusing on memory layout, function contracts, and data flow.

---

### Core Principle

Avoid copying data. Operate on shared linear memory whenever possible.

---

## Memory Model

Wasm exposes a **linear memory buffer** that both JS and Rust can access.

```
┌───────────────────────────────────────┐
│           Wasm Linear Memory          │
├───────────────────────────────────────┤
│ Image Buffer (RGBA)                  │
│ [R,G,B,A, R,G,B,A, ...]              │
├───────────────────────────────────────┤
│ Scratch / Temp Buffers               │
├───────────────────────────────────────┤
│ Allocator Metadata                   │
└───────────────────────────────────────┘
```

Each pixel = 4 bytes (RGBA)

---

## Data Representation

### JS Side

```ts
Uint8ClampedArray // from Canvas ImageData
```

### Rust Side

```rust
&mut [u8] // raw pixel buffer
```

---

## Memory Layout Example

For a 2x2 image:

```
Pixel ترتیب:

(0,0) (1,0)
(0,1) (1,1)

Buffer:

[R,G,B,A,  R,G,B,A,
 R,G,B,A,  R,G,B,A]
```

Index formula:

```
index = (y * width + x) * 4
```

---

## API Design Options

### Option A (Recommended): JS Owns Memory

JS creates buffer → passes pointer to Wasm

### Flow

```
JS allocates Uint8Array
        ↓
Copy into Wasm memory
        ↓
Pass pointer to Rust
        ↓
Rust mutates in-place
        ↓
JS reads updated memory
```

---

## Exported Wasm Functions

### 1. Memory Allocation (optional helper)

```rust
#[wasm_bindgen]
pub fn alloc(size: usize) -> *mut u8;
```

```rust
#[wasm_bindgen]
pub fn dealloc(ptr: *mut u8, size: usize);
```

---

### 2. Grayscale Filter

```rust
#[wasm_bindgen]
pub fn grayscale(ptr: *mut u8, len: usize);
```

**Contract:**

* `ptr`: pointer to start of RGBA buffer
* `len`: total buffer length
* Mutates buffer in-place

---

### 3. Blur Filter

```rust
#[wasm_bindgen]
pub fn blur(ptr: *mut u8, width: u32, height: u32);
```

**Contract:**

* Uses width/height to compute neighbors
* May use temporary buffer internally

---

### 4. Edge Detection

```rust
#[wasm_bindgen]
pub fn edge_detect(ptr: *mut u8, width: u32, height: u32);
```

---

## JS Wrapper Layer

You should NEVER call Wasm functions directly from UI code.

Create a wrapper:

```ts
class WasmImageProcessor {
  memory: WebAssembly.Memory;
  instance: any;

  grayscale(data: Uint8ClampedArray) {
    const ptr = this.copyToWasm(data);
    this.instance.grayscale(ptr, data.length);
    return this.copyFromWasm(ptr, data.length);
  }
}
```

---

## Copy Strategy

### Copy Into Wasm

```ts
copyToWasm(data) {
  const ptr = this.instance.alloc(data.length);
  const mem = new Uint8Array(this.memory.buffer);
  mem.set(data, ptr);
  return ptr;
}
```

### Copy Back

```ts
copyFromWasm(ptr, len) {
  const mem = new Uint8Array(this.memory.buffer);
  return mem.slice(ptr, ptr + len);
}
```

---

## Zero-Copy Optimization (Advanced)

Instead of copying back, reuse the same buffer:

```
JS TypedArray VIEW → Wasm Memory Buffer
```

```ts
const mem = new Uint8ClampedArray(wasm.memory.buffer, ptr, len);
```

⚠️ Must ensure memory is not reallocated

---

## Internal Rust Memory Handling

Convert pointer to slice:

```rust
pub fn get_slice<'a>(ptr: *mut u8, len: usize) -> &'a mut [u8] {
    unsafe { std::slice::from_raw_parts_mut(ptr, len) }
}
```

---

## Example: Grayscale Implementation

```rust
pub fn grayscale(ptr: *mut u8, len: usize) {
    let data = get_slice(ptr, len);

    for i in (0..len).step_by(4) {
        let r = data[i] as f32;
        let g = data[i + 1] as f32;
        let b = data[i + 2] as f32;

        let gray = (0.3 * r + 0.59 * g + 0.11 * b) as u8;

        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
    }
}
```

---

## Error Handling Strategy

Avoid exceptions across boundary.

Instead:

* Return status codes
* Or validate inputs in JS before calling Wasm

---

## Performance Considerations

### Cost Centers

* Memory copy JS → Wasm
* Memory copy Wasm → JS
* Boundary crossing (function calls)

### Optimization Strategy

* Batch operations
* Minimize calls
* Prefer in-place mutation

---

## Threading Extension (Future)

Memory becomes shared:

```
SharedArrayBuffer
        ↓
Multiple Wasm Workers
```

Requires:

* Atomics
* Chunk-based processing

---

## API Summary

| Function    | Input              | Output | Notes    |
| ----------- | ------------------ | ------ | -------- |
| alloc       | size               | ptr    | optional |
| dealloc     | ptr, size          | void   | optional |
| grayscale   | ptr, len           | void   | in-place |
| blur        | ptr, width, height | void   | in-place |
| edge_detect | ptr, width, height | void   | in-place |

---

## Summary

This API design emphasizes:

* Minimal copying
* Explicit memory control
* Predictable performance
* Clear separation between UI and compute

It mirrors how real-world high-performance Wasm systems are built.

This architecture focuses on isolating compute-heavy logic in Rust while keeping UI and orchestration in JavaScript. The design emphasizes performance, memory efficiency, and clear separation of concerns, making it ideal for exploring real-world WebAssembly capabilities.
