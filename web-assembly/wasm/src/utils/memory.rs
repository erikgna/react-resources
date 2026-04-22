pub unsafe fn get_slice<'a>(ptr: *mut u8, len: usize) -> &'a mut [u8] {
    std::slice::from_raw_parts_mut(ptr, len)
}

pub fn alloc_buf(size: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(size);
    buf.resize(size, 0u8);
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

pub unsafe fn free_buf(ptr: *mut u8, size: usize) {
    drop(Vec::from_raw_parts(ptr, size, size));
}
