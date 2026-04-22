pub fn apply(data: &mut [u8]) {
    let len = data.len();
    let mut i = 0;
    while i + 3 < len {
        let r = data[i] as f32;
        let g = data[i + 1] as f32;
        let b = data[i + 2] as f32;
        let gray = (0.3 * r + 0.59 * g + 0.11 * b) as u8;
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
        i += 4;
    }
}
