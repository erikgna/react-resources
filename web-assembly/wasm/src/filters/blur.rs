pub fn apply(data: &mut [u8], width: u32, height: u32) {
    let w = width as usize;
    let h = height as usize;
    let src = data.to_vec();

    for y in 0..h {
        for x in 0..w {
            let mut r = 0u32;
            let mut g = 0u32;
            let mut b = 0u32;
            let mut count = 0u32;

            for dy in -1i32..=1 {
                for dx in -1i32..=1 {
                    let nx = x as i32 + dx;
                    let ny = y as i32 + dy;
                    if nx >= 0 && nx < w as i32 && ny >= 0 && ny < h as i32 {
                        let idx = (ny as usize * w + nx as usize) * 4;
                        r += src[idx] as u32;
                        g += src[idx + 1] as u32;
                        b += src[idx + 2] as u32;
                        count += 1;
                    }
                }
            }

            let idx = (y * w + x) * 4;
            data[idx] = (r / count) as u8;
            data[idx + 1] = (g / count) as u8;
            data[idx + 2] = (b / count) as u8;
        }
    }
}

pub fn apply_chain(data: &mut [u8], width: u32, height: u32, passes: u32) {
    let w = width as usize;
    let h = height as usize;
    // one temp buffer reused across all passes
    let mut temp = vec![0u8; data.len()];

    for _ in 0..passes {
        temp.copy_from_slice(data);

        for y in 0..h {
            for x in 0..w {
                let mut r = 0u32;
                let mut g = 0u32;
                let mut b = 0u32;
                let mut count = 0u32;

                for dy in -1i32..=1 {
                    for dx in -1i32..=1 {
                        let nx = x as i32 + dx;
                        let ny = y as i32 + dy;
                        if nx >= 0 && nx < w as i32 && ny >= 0 && ny < h as i32 {
                            let idx = (ny as usize * w + nx as usize) * 4;
                            r += temp[idx] as u32;
                            g += temp[idx + 1] as u32;
                            b += temp[idx + 2] as u32;
                            count += 1;
                        }
                    }
                }

                let idx = (y * w + x) * 4;
                data[idx] = (r / count) as u8;
                data[idx + 1] = (g / count) as u8;
                data[idx + 2] = (b / count) as u8;
            }
        }
    }
}

// Precomputed 11×11 Gaussian kernel, sigma=1.5, normalized
const GAUSSIAN_KERNEL: [[f32; 11]; 11] = [
    [0.000036, 0.000362, 0.001445, 0.002289, 0.002878, 0.002878, 0.002878, 0.002289, 0.001445, 0.000362, 0.000036],
    [0.000362, 0.003621, 0.014445, 0.022883, 0.028778, 0.028778, 0.028778, 0.022883, 0.014445, 0.003621, 0.000362],
    [0.001445, 0.014445, 0.057648, 0.091313, 0.114826, 0.114826, 0.114826, 0.091313, 0.057648, 0.014445, 0.001445],
    [0.002289, 0.022883, 0.091313, 0.144620, 0.181929, 0.181929, 0.181929, 0.144620, 0.091313, 0.022883, 0.002289],
    [0.002878, 0.028778, 0.114826, 0.181929, 0.228868, 0.228868, 0.228868, 0.181929, 0.114826, 0.028778, 0.002878],
    [0.002878, 0.028778, 0.114826, 0.181929, 0.228868, 0.228868, 0.228868, 0.181929, 0.114826, 0.028778, 0.002878],
    [0.002878, 0.028778, 0.114826, 0.181929, 0.228868, 0.228868, 0.228868, 0.181929, 0.114826, 0.028778, 0.002878],
    [0.002289, 0.022883, 0.091313, 0.144620, 0.181929, 0.181929, 0.181929, 0.144620, 0.091313, 0.022883, 0.002289],
    [0.001445, 0.014445, 0.057648, 0.091313, 0.114826, 0.114826, 0.114826, 0.091313, 0.057648, 0.014445, 0.001445],
    [0.000362, 0.003621, 0.014445, 0.022883, 0.028778, 0.028778, 0.028778, 0.022883, 0.014445, 0.003621, 0.000362],
    [0.000036, 0.000362, 0.001445, 0.002289, 0.002878, 0.002878, 0.002878, 0.002289, 0.001445, 0.000362, 0.000036],
];

pub fn apply_gaussian(data: &mut [u8], width: u32, height: u32) {
    let w = width as usize;
    let h = height as usize;
    let src = data.to_vec();
    let radius = 5i32;

    for y in 0..h {
        for x in 0..w {
            let mut r = 0f32;
            let mut g = 0f32;
            let mut b = 0f32;
            let mut weight_sum = 0f32;

            for ky in 0..11usize {
                for kx in 0..11usize {
                    let nx = x as i32 + (kx as i32 - radius);
                    let ny = y as i32 + (ky as i32 - radius);
                    if nx >= 0 && nx < w as i32 && ny >= 0 && ny < h as i32 {
                        let idx = (ny as usize * w + nx as usize) * 4;
                        let w = GAUSSIAN_KERNEL[ky][kx];
                        r += src[idx] as f32 * w;
                        g += src[idx + 1] as f32 * w;
                        b += src[idx + 2] as f32 * w;
                        weight_sum += w;
                    }
                }
            }

            let idx = (y * w + x) * 4;
            data[idx] = (r / weight_sum).min(255.0) as u8;
            data[idx + 1] = (g / weight_sum).min(255.0) as u8;
            data[idx + 2] = (b / weight_sum).min(255.0) as u8;
        }
    }
}
