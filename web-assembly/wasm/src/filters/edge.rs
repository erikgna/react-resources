pub fn apply(data: &mut [u8], width: u32, height: u32) {
    let w = width as usize;
    let h = height as usize;
    let src = data.to_vec();

    let kx: [[i32; 3]; 3] = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    let ky: [[i32; 3]; 3] = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

    for y in 0..h {
        for x in 0..w {
            let mut gx = 0i32;
            let mut gy = 0i32;

            for dy in -1i32..=1 {
                for dx in -1i32..=1 {
                    let nx = x as i32 + dx;
                    let ny = y as i32 + dy;
                    let gray = if nx >= 0 && nx < w as i32 && ny >= 0 && ny < h as i32 {
                        let idx = (ny as usize * w + nx as usize) * 4;
                        let r = src[idx] as f32;
                        let g = src[idx + 1] as f32;
                        let b = src[idx + 2] as f32;
                        (0.3 * r + 0.59 * g + 0.11 * b) as i32
                    } else {
                        0
                    };
                    let ki = (dy + 1) as usize;
                    let kj = (dx + 1) as usize;
                    gx += kx[ki][kj] * gray;
                    gy += ky[ki][kj] * gray;
                }
            }

            let mag = ((gx * gx + gy * gy) as f32).sqrt().min(255.0) as u8;
            let idx = (y * w + x) * 4;
            data[idx] = mag;
            data[idx + 1] = mag;
            data[idx + 2] = mag;
        }
    }
}
