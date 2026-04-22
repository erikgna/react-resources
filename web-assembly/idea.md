Image Processing Engine (Best all-around POC)

Build a small web app where users upload an image and apply filters (blur, edge detection, grayscale, resize).

Why this is excellent:

Forces you to use linear memory (pass pixel buffers)
Shows performance gains vs JS
Requires interop (JS ↔ Wasm)
Lets you experiment with SIMD

Features to include:

Convolution filters (blur, sharpen)
Histogram calculation
Resize algorithms (nearest vs bilinear)
Benchmark vs pure JS

Tech stack:

Rust or C++ → Wasm
JS frontend (Canvas API)