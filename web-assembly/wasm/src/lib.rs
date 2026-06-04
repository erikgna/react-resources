mod utils;

use utils::memory::{alloc_buf, free_buf, get_slice};
// wasm_bindgen generates JS wrapper functions from #[wasm_bindgen] annotations.
// Without it, Rust functions are compiled into the binary but invisible to JavaScript.
use wasm_bindgen::prelude::*;

// alloc/dealloc are the manual memory management layer.
// JavaScript must call these around every Wasm operation:
//   ptr = alloc(n)  →  copy data into memory[ptr]  →  call function  →  dealloc(ptr, n)

#[wasm_bindgen]
pub fn alloc(size: usize) -> *mut u8 {
    // size is in BYTES. Returns an integer (byte offset into Wasm linear memory).
    // JavaScript uses this integer to know where to write data before calling Rust.
    alloc_buf(size)
}

#[wasm_bindgen]
pub unsafe fn dealloc(ptr: *mut u8, size: usize) {
    // unsafe: raw pointer — Rust cannot verify ptr is valid. Caller must pass the exact
    // ptr+size it received from alloc(). Passing wrong values corrupts memory silently.
    free_buf(ptr, size);
}

// Reads `count` i32 values from Wasm memory starting at `ptr`, doubles each in-place.
// JS writes the input array into memory[ptr..] before calling this, then reads back the result.
#[wasm_bindgen]
pub unsafe fn double_values(ptr: *mut u8, count: usize) {
    // Interpret the raw byte buffer as `count` × 4-byte little-endian i32 values.
    // Wasm is always little-endian (mandated by the Wasm spec), so from_le_bytes is correct
    // regardless of the host machine's byte order.
    let bytes = get_slice(ptr, count * 4);
    for i in 0..count {
        let off = i * 4;
        // Read 4 bytes → i32. The array syntax avoids try_into().unwrap() panics.
        let val = i32::from_le_bytes([bytes[off], bytes[off + 1], bytes[off + 2], bytes[off + 3]]);
        // Write the doubled value back into the same 4 bytes.
        bytes[off..off + 4].copy_from_slice(&(val * 2).to_le_bytes());
    }
}
