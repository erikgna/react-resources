// Reconstruct a mutable slice from a raw pointer + byte length.
// This is the only way to let Rust code operate on memory whose address
// came from JavaScript (JS passes an integer offset, not a Rust reference).
// Unsafe: the caller must guarantee ptr is valid and len is correct.
pub unsafe fn get_slice<'a>(ptr: *mut u8, len: usize) -> &'a mut [u8] {
    // from_raw_parts_mut trusts us completely — no bounds check, no ownership check.
    // The 'a lifetime is unconstrained here because Wasm linear memory lives for
    // the entire module lifetime, so the slice is always valid while the module runs.
    std::slice::from_raw_parts_mut(ptr, len)
}

pub fn alloc_buf(size: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(size);
    buf.resize(size, 0u8);
    let ptr = buf.as_mut_ptr();
    // mem::forget prevents Rust from dropping (freeing) the Vec when it goes out
    // of scope. This intentionally "leaks" the allocation so the memory stays alive
    // after this function returns. Without forget, Rust frees it immediately and JS
    // receives a dangling pointer.
    std::mem::forget(buf);
    ptr
}

pub unsafe fn free_buf(ptr: *mut u8, size: usize) {
    // Reconstruct the Vec from the same pointer + length we forgot above.
    // drop() at end of this block runs Vec's destructor, which actually frees.
    // Capacity == size because alloc_buf resized to exactly `size` bytes.
    drop(Vec::from_raw_parts(ptr, size, size));
}
