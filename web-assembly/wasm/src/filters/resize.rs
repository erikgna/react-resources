use crate::utils::memory::alloc_buf;

pub fn apply(
    src: &[u8],
    src_w: u32,
    src_h: u32,
    dst_w: u32,
    dst_h: u32,
) -> *mut u8 {
    let sw = src_w as usize;
    let sh = src_h as usize;
    let dw = dst_w as usize;
    let dh = dst_h as usize;
    let dst_len = dw * dh * 4;
    let dst_ptr = alloc_buf(dst_len);
    let dst = unsafe { std::slice::from_raw_parts_mut(dst_ptr, dst_len) };

    let x_ratio = sw as f32 / dw as f32;
    let y_ratio = sh as f32 / dh as f32;

    for dy in 0..dh {
        for dx in 0..dw {
            let sx = (dx as f32 * x_ratio).min((sw - 1) as f32);
            let sy = (dy as f32 * y_ratio).min((sh - 1) as f32);

            let x0 = sx as usize;
            let y0 = sy as usize;
            let x1 = (x0 + 1).min(sw - 1);
            let y1 = (y0 + 1).min(sh - 1);
            let xf = sx - x0 as f32;
            let yf = sy - y0 as f32;

            for c in 0..3usize {
                let tl = src[(y0 * sw + x0) * 4 + c] as f32;
                let tr = src[(y0 * sw + x1) * 4 + c] as f32;
                let bl = src[(y1 * sw + x0) * 4 + c] as f32;
                let br = src[(y1 * sw + x1) * 4 + c] as f32;
                let val = tl * (1.0 - xf) * (1.0 - yf)
                    + tr * xf * (1.0 - yf)
                    + bl * (1.0 - xf) * yf
                    + br * xf * yf;
                dst[(dy * dw + dx) * 4 + c] = val as u8;
            }
            dst[(dy * dw + dx) * 4 + 3] = 255;
        }
    }

    dst_ptr
}
