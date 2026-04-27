pub fn render(data: &mut [u8], width: u32, height: u32, max_iter: u32) {
    let w = width as usize;
    let h = height as usize;

    for y in 0..h {
        for x in 0..w {
            let cx = (x as f64 / w as f64) * 3.5 - 2.5;
            let cy = (y as f64 / h as f64) * 2.5 - 1.25;

            let mut zx = 0.0f64;
            let mut zy = 0.0f64;
            let mut iter = 0u32;

            while zx * zx + zy * zy <= 4.0 && iter < max_iter {
                let tmp = zx * zx - zy * zy + cx;
                zy = 2.0 * zx * zy + cy;
                zx = tmp;
                iter += 1;
            }

            let idx = (y * w + x) * 4;
            if iter == max_iter {
                data[idx] = 0;
                data[idx + 1] = 0;
                data[idx + 2] = 0;
            } else {
                let t = iter as f64 / max_iter as f64;
                data[idx] = (9.0 * (1.0 - t) * t * t * t * 255.0) as u8;
                data[idx + 1] = (15.0 * (1.0 - t) * (1.0 - t) * t * t * 255.0) as u8;
                data[idx + 2] = (8.5 * (1.0 - t) * (1.0 - t) * (1.0 - t) * t * 255.0) as u8;
            }
            data[idx + 3] = 255;
        }
    }
}
