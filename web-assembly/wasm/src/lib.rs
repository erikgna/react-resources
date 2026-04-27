mod filters;
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
pub unsafe fn grayscale(ptr: *mut u8, len: usize) {
    let data = get_slice(ptr, len);
    filters::grayscale::apply(data);
}

#[wasm_bindgen]
pub unsafe fn blur(ptr: *mut u8, width: u32, height: u32) {
    let len = (width * height * 4) as usize;
    let data = get_slice(ptr, len);
    filters::blur::apply(data, width, height);
}

#[wasm_bindgen]
pub unsafe fn blur_chain(ptr: *mut u8, width: u32, height: u32, passes: u32) {
    let len = (width * height * 4) as usize;
    let data = get_slice(ptr, len);
    filters::blur::apply_chain(data, width, height, passes);
}

#[wasm_bindgen]
pub unsafe fn gaussian_blur(ptr: *mut u8, width: u32, height: u32) {
    let len = (width * height * 4) as usize;
    let data = get_slice(ptr, len);
    filters::blur::apply_gaussian(data, width, height);
}

#[wasm_bindgen]
pub unsafe fn edge_detect(ptr: *mut u8, width: u32, height: u32) {
    let len = (width * height * 4) as usize;
    let data = get_slice(ptr, len);
    filters::edge::apply(data, width, height);
}

#[wasm_bindgen]
pub unsafe fn resize(
    ptr: *mut u8,
    src_w: u32,
    src_h: u32,
    dst_w: u32,
    dst_h: u32,
) -> *mut u8 {
    let len = (src_w * src_h * 4) as usize;
    let src = get_slice(ptr, len);
    filters::resize::apply(src, src_w, src_h, dst_w, dst_h)
}

#[wasm_bindgen]
pub fn resize_buf_size(dst_w: u32, dst_h: u32) -> usize {
    (dst_w * dst_h * 4) as usize
}

#[wasm_bindgen]
pub unsafe fn bilateral_filter(ptr: *mut u8, width: u32, height: u32) {
    let len = (width * height * 4) as usize;
    let data = get_slice(ptr, len);
    filters::bilateral::apply(data, width, height, 10, 10.0, 30.0);
}

#[wasm_bindgen]
pub unsafe fn mandelbrot(ptr: *mut u8, width: u32, height: u32, max_iter: u32) {
    let len = (width * height * 4) as usize;
    let data = get_slice(ptr, len);
    filters::mandelbrot::render(data, width, height, max_iter);
}
