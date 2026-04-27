import { WasmImageProcessor } from "./wasmClient.js";

export type FilterName = "grayscale" | "blur" | "edge" | "blur-chain" | "gaussian" | "bilateral" | "mandelbrot";

function jsGrayscale(data: Uint8ClampedArray): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data);
  for (let i = 0; i < out.length; i += 4) {
    const gray = 0.3 * out[i] + 0.59 * out[i + 1] + 0.11 * out[i + 2];
    out[i] = out[i + 1] = out[i + 2] = gray;
  }
  return out;
}

function jsBlur(data: Uint8ClampedArray, w: number, h: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const idx = (ny * w + nx) * 4;
            r += data[idx]; g += data[idx + 1]; b += data[idx + 2];
            count++;
          }
        }
      }
      const idx = (y * w + x) * 4;
      out[idx] = r / count; out[idx + 1] = g / count; out[idx + 2] = b / count;
      out[idx + 3] = data[idx + 3];
    }
  }
  return out;
}

function jsBlurChain(data: Uint8ClampedArray, w: number, h: number, passes: number): Uint8ClampedArray {
  let current = new Uint8ClampedArray(data);
  for (let i = 0; i < passes; i++) {
    current = jsBlur(current, w, h);
  }
  return current;
}

// Precomputed 11×11 Gaussian kernel matching Rust implementation
const GAUSSIAN_KERNEL: number[][] = [
  [0.000036,0.000362,0.001445,0.002289,0.002878,0.002878,0.002878,0.002289,0.001445,0.000362,0.000036],
  [0.000362,0.003621,0.014445,0.022883,0.028778,0.028778,0.028778,0.022883,0.014445,0.003621,0.000362],
  [0.001445,0.014445,0.057648,0.091313,0.114826,0.114826,0.114826,0.091313,0.057648,0.014445,0.001445],
  [0.002289,0.022883,0.091313,0.144620,0.181929,0.181929,0.181929,0.144620,0.091313,0.022883,0.002289],
  [0.002878,0.028778,0.114826,0.181929,0.228868,0.228868,0.228868,0.181929,0.114826,0.028778,0.002878],
  [0.002878,0.028778,0.114826,0.181929,0.228868,0.228868,0.228868,0.181929,0.114826,0.028778,0.002878],
  [0.002878,0.028778,0.114826,0.181929,0.228868,0.228868,0.228868,0.181929,0.114826,0.028778,0.002878],
  [0.002289,0.022883,0.091313,0.144620,0.181929,0.181929,0.181929,0.144620,0.091313,0.022883,0.002289],
  [0.001445,0.014445,0.057648,0.091313,0.114826,0.114826,0.114826,0.091313,0.057648,0.014445,0.001445],
  [0.000362,0.003621,0.014445,0.022883,0.028778,0.028778,0.028778,0.022883,0.014445,0.003621,0.000362],
  [0.000036,0.000362,0.001445,0.002289,0.002878,0.002878,0.002878,0.002289,0.001445,0.000362,0.000036],
];

function jsGaussian(data: Uint8ClampedArray, w: number, h: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data.length);
  const radius = 5;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, weightSum = 0;
      for (let ky = 0; ky < 11; ky++) {
        for (let kx = 0; kx < 11; kx++) {
          const nx = x + (kx - radius);
          const ny = y + (ky - radius);
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const idx = (ny * w + nx) * 4;
            const wt = GAUSSIAN_KERNEL[ky][kx];
            r += data[idx] * wt;
            g += data[idx + 1] * wt;
            b += data[idx + 2] * wt;
            weightSum += wt;
          }
        }
      }
      const idx = (y * w + x) * 4;
      out[idx] = Math.min(r / weightSum, 255);
      out[idx + 1] = Math.min(g / weightSum, 255);
      out[idx + 2] = Math.min(b / weightSum, 255);
      out[idx + 3] = data[idx + 3];
    }
  }
  return out;
}

function jsEdge(data: Uint8ClampedArray, w: number, h: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data.length);
  const kx = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
  const ky = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let gx = 0, gy = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          let gray = 0;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const idx = (ny * w + nx) * 4;
            gray = 0.3 * data[idx] + 0.59 * data[idx + 1] + 0.11 * data[idx + 2];
          }
          gx += kx[dy + 1][dx + 1] * gray;
          gy += ky[dy + 1][dx + 1] * gray;
        }
      }
      const mag = Math.min(Math.sqrt(gx * gx + gy * gy), 255);
      const idx = (y * w + x) * 4;
      out[idx] = out[idx + 1] = out[idx + 2] = mag;
      out[idx + 3] = 255;
    }
  }
  return out;
}

function jsBilateral(data: Uint8ClampedArray, w: number, h: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data.length);
  const radius = 10;
  const sigmaSS = -1.0 / (2.0 * 10.0 * 10.0);
  const sigmaSR = -1.0 / (2.0 * 30.0 * 30.0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ci = (y * w + x) * 4;
      const cr = data[ci], cg = data[ci + 1], cb = data[ci + 2];
      let sumR = 0, sumG = 0, sumB = 0, wSum = 0;
      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const nx = x + kx, ny = y + ky;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const idx = (ny * w + nx) * 4;
            const pr = data[idx], pg = data[idx + 1], pb = data[idx + 2];
            const spatial = (kx * kx + ky * ky) * sigmaSS;
            const dr = pr - cr, dg = pg - cg, db = pb - cb;
            const range = (dr * dr + dg * dg + db * db) * sigmaSR;
            const wt = Math.exp(spatial + range);
            sumR += pr * wt; sumG += pg * wt; sumB += pb * wt;
            wSum += wt;
          }
        }
      }
      out[ci] = Math.min(sumR / wSum, 255);
      out[ci + 1] = Math.min(sumG / wSum, 255);
      out[ci + 2] = Math.min(sumB / wSum, 255);
      out[ci + 3] = data[ci + 3];
    }
  }
  return out;
}

const MANDELBROT_W = 800;
const MANDELBROT_H = 600;
const MANDELBROT_ITER = 500;

function jsMandelbrot(): Uint8ClampedArray {
  const w = MANDELBROT_W, h = MANDELBROT_H;
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cx = (x / w) * 3.5 - 2.5;
      const cy = (y / h) * 2.5 - 1.25;
      let zx = 0, zy = 0, iter = 0;
      while (zx * zx + zy * zy <= 4 && iter < MANDELBROT_ITER) {
        const tmp = zx * zx - zy * zy + cx;
        zy = 2 * zx * zy + cy;
        zx = tmp;
        iter++;
      }
      const idx = (y * w + x) * 4;
      if (iter === MANDELBROT_ITER) {
        out[idx] = out[idx + 1] = out[idx + 2] = 0;
      } else {
        const t = iter / MANDELBROT_ITER;
        out[idx] = Math.min(9 * (1 - t) * t * t * t * 255, 255);
        out[idx + 1] = Math.min(15 * (1 - t) ** 2 * t * t * 255, 255);
        out[idx + 2] = Math.min(8.5 * (1 - t) ** 3 * t * 255, 255);
      }
      out[idx + 3] = 255;
    }
  }
  return out;
}

const RUNS = 3;
const CHAIN_PASSES = 10;

export async function runBenchmark(
  filter: FilterName,
  imgData: ImageData,
  wasm: WasmImageProcessor
): Promise<{ wasmMs: number; jsMs: number }> {
  const { data, width, height } = imgData;

  const runs = filter === "bilateral" ? 1 : RUNS;

  let wasmTotal = 0;
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    if (filter === "grayscale") wasm.grayscale(data);
    else if (filter === "blur") wasm.blur(data, width, height);
    else if (filter === "blur-chain") wasm.blurChain(data, width, height, CHAIN_PASSES);
    else if (filter === "gaussian") wasm.gaussianBlur(data, width, height);
    else if (filter === "bilateral") wasm.bilateralFilter(data, width, height);
    else if (filter === "mandelbrot") wasm.mandelbrot(MANDELBROT_W, MANDELBROT_H, MANDELBROT_ITER);
    else wasm.edgeDetect(data, width, height);
    wasmTotal += performance.now() - t0;
  }

  let jsTotal = 0;
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    if (filter === "grayscale") jsGrayscale(data);
    else if (filter === "blur") jsBlur(data, width, height);
    else if (filter === "blur-chain") jsBlurChain(data, width, height, CHAIN_PASSES);
    else if (filter === "gaussian") jsGaussian(data, width, height);
    else if (filter === "bilateral") jsBilateral(data, width, height);
    else if (filter === "mandelbrot") jsMandelbrot();
    else jsEdge(data, width, height);
    jsTotal += performance.now() - t0;
  }

  return {
    wasmMs: Math.round((wasmTotal / RUNS) * 100) / 100,
    jsMs: Math.round((jsTotal / RUNS) * 100) / 100,
  };
}
