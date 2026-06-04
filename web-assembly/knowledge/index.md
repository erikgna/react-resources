WebAssembly runs compiled binary code (from Rust, C, Go, etc.) inside a sandboxed VM in the browser at near-native speed.

JS is text interpreted at runtime. Wasm is a binary already compiled — browser JITs it to machine code at load time.

WASM constraints:
- Cannot touch the DOM
- Cannot call browser APIs directly
- Has its own isolated linear memory (a flat byte array)
- Communicates with the outside world only via exported/imported functions

Flow:
JS → calls Wasm function → Wasm executes in sandbox → returns result to JS

Compilation pipeline:
Source code (Rust)
      ↓
  cargo (target: wasm32-unknown-unknown)
      ↓
  .wasm binary
      ↓
  wasm-bindgen (generates JS glue + TypeScript types)
      ↓
Browser loads binary + glue, calls Rust functions as if they were JS

Memory model (the hard part):
Wasm has one flat byte array — WebAssembly.Memory.
Both Rust and JS read/write the SAME bytes.
A "pointer" is just an integer: a byte offset into that array.

JS protocol for every Wasm call:
  1. alloc(n)               → ptr  (Rust allocates n bytes, returns byte offset)
  2. memory[ptr] ← data     (JS writes input into Wasm memory)
  3. rust_function(ptr, n)  (Rust reads/mutates those bytes)
  4. result ← memory[ptr]   (JS reads result back)
  5. dealloc(ptr, n)        (Rust frees the allocation)

This POC:
Pass an array of integers from JS → Wasm → Rust doubles each value → back to JS.
Isolates the memory protocol with zero domain complexity (no images, no 2D layout).
