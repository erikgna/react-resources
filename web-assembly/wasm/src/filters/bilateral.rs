pub fn apply(data: &mut [u8], width: u32, height: u32, radius: i32, sigma_s: f32, sigma_r: f32) {
    let w = width as usize;
    let h = height as usize;
    let src = data.to_vec();
    let neg_inv_two_ss = -1.0 / (2.0 * sigma_s * sigma_s);
    let neg_inv_two_sr = -1.0 / (2.0 * sigma_r * sigma_r);

    for y in 0..h {
        for x in 0..w {
            let ci = (y * w + x) * 4;
            let cr = src[ci] as f32;
            let cg = src[ci + 1] as f32;
            let cb = src[ci + 2] as f32;

            let mut sum_r = 0f32;
            let mut sum_g = 0f32;
            let mut sum_b = 0f32;
            let mut weight_sum = 0f32;

            for ky in -radius..=radius {
                for kx in -radius..=radius {
                    let nx = x as i32 + kx;
                    let ny = y as i32 + ky;
                    if nx >= 0 && nx < w as i32 && ny >= 0 && ny < h as i32 {
                        let idx = (ny as usize * w + nx as usize) * 4;
                        let pr = src[idx] as f32;
                        let pg = src[idx + 1] as f32;
                        let pb = src[idx + 2] as f32;

                        let spatial_dist = (kx * kx + ky * ky) as f32;
                        let dr = pr - cr;
                        let dg = pg - cg;
                        let db = pb - cb;
                        let range_dist = dr * dr + dg * dg + db * db;

                        let w = (spatial_dist * neg_inv_two_ss + range_dist * neg_inv_two_sr).exp();
                        sum_r += pr * w;
                        sum_g += pg * w;
                        sum_b += pb * w;
                        weight_sum += w;
                    }
                }
            }

            data[ci] = (sum_r / weight_sum).min(255.0) as u8;
            data[ci + 1] = (sum_g / weight_sum).min(255.0) as u8;
            data[ci + 2] = (sum_b / weight_sum).min(255.0) as u8;
        }
    }
}
