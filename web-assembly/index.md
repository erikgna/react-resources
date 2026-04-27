Used to run low level code and binary instructions at near native speed in the browser.

Compile Rust, C, Go, etc. to WebAssembly.

JS is text based, but WebAssembly is binary.

WASM runs into sandboxed virtual machine in the browser.
Memory is isolated, does not have access to DOM, it interacts with real world via exports/imports.

Wasm uses a liner memory model, like ArrayBuffer.

Flow:
JS → loads WASM → calls function → WASM executes → returns result

How it works:
Source Code (Rust/C++)
        ↓
   Compiler (e.g. LLVM)
        ↓
   .wasm binary
        ↓
 Browser / Runtime (V8, Wasmtime)
        ↓
 Execution inside sandbox

Pros:
Near native performance
Ideal for image/video processing, games, physics simulations, data heavy applications.
Portable since runs in all major browsers and same binary works everywhere.
It's secure since it's sandboxed and isolated from the browser.
Fast startup since it's already compiled.

Cons:
No DOM access, must use JS to interact with the DOM.
May need memory management, pointer arithmetic and unsafe code.
Bundle size can be large if not optimized.
