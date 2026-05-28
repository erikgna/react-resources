mod utils;

use utils::memory::{alloc_buf, free_buf, get_slice};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn alloc(size: usize) -> *mut u8 {
    alloc_buf(size)
}

#[wasm_bindgen]
pub unsafe fn dealloc(ptr: *mut u8, size: usize) {
    free_buf(ptr, size);
}

#[wasm_bindgen]
pub unsafe fn double_values(ptr: *mut u8, count: usize) {
    let bytes = get_slice(ptr, count * 4);
    for i in 0..count {
        let off = i * 4;
        let val = i32::from_le_bytes([bytes[off], bytes[off + 1], bytes[off + 2], bytes[off + 3]]);
        bytes[off..off + 4].copy_from_slice(&(val * 2).to_le_bytes());
    }
}
