import { WasmImageProcessor } from "./wasmClient.js";

export type FilterName = "grayscale" | "blur" | "edge" | "blur-chain" | "gaussian";

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

const RUNS = 3;
const CHAIN_PASSES = 10;

export async function runBenchmark(
  filter: FilterName,
  imgData: ImageData,
  wasm: WasmImageProcessor
): Promise<{ wasmMs: number; jsMs: number }> {
  const { data, width, height } = imgData;

  let wasmTotal = 0;
  for (let i = 0; i < RUNS; i++) {
    const t0 = performance.now();
    if (filter === "grayscale") wasm.grayscale(data);
    else if (filter === "blur") wasm.blur(data, width, height);
    else if (filter === "blur-chain") wasm.blurChain(data, width, height, CHAIN_PASSES);
    else if (filter === "gaussian") wasm.gaussianBlur(data, width, height);
    else wasm.edgeDetect(data, width, height);
    wasmTotal += performance.now() - t0;
  }

  let jsTotal = 0;
  for (let i = 0; i < RUNS; i++) {
    const t0 = performance.now();
    if (filter === "grayscale") jsGrayscale(data);
    else if (filter === "blur") jsBlur(data, width, height);
    else if (filter === "blur-chain") jsBlurChain(data, width, height, CHAIN_PASSES);
    else if (filter === "gaussian") jsGaussian(data, width, height);
    else jsEdge(data, width, height);
    jsTotal += performance.now() - t0;
  }

  return {
    wasmMs: Math.round((wasmTotal / RUNS) * 100) / 100,
    jsMs: Math.round((jsTotal / RUNS) * 100) / 100,
  };
}
