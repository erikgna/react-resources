import { WasmImageProcessor } from "./wasmClient.js";
import { loadImageData, renderToCanvas } from "./canvas.js";
import { runBenchmark, FilterName } from "./benchmark.js";

const wasm = new WasmImageProcessor();
let currentImage: ImageData | null = null;

const originalCanvas = document.getElementById("original") as HTMLCanvasElement;
const processedCanvas = document.getElementById("processed") as HTMLCanvasElement;
const statusEl = document.getElementById("status")!;
const benchmarkBody = document.getElementById("benchmark-body")!;

async function init() {
  statusEl.textContent = "Loading Wasm...";
  await wasm.init();
  statusEl.textContent = "Ready. Upload an image.";
}

document.getElementById("file-input")!.addEventListener("change", async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  currentImage = await loadImageData(file);
  renderToCanvas(originalCanvas, currentImage.data, currentImage.width, currentImage.height);
  statusEl.textContent = `Loaded ${currentImage.width}×${currentImage.height}`;
  processedCanvas.width = currentImage.width;
  processedCanvas.height = currentImage.height;
  const ctx = processedCanvas.getContext("2d")!;
  ctx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
});

async function applyFilter(name: FilterName) {
  if (!currentImage) return;
  statusEl.textContent = "Processing...";

  const { data, width, height } = currentImage;
  let result: Uint8ClampedArray;

  if (name === "grayscale") result = wasm.grayscale(data);
  else if (name === "blur") result = wasm.blur(data, width, height);
  else if (name === "blur-chain") result = wasm.blurChain(data, width, height, 10);
  else if (name === "gaussian") result = wasm.gaussianBlur(data, width, height);
  else result = wasm.edgeDetect(data, width, height);

  renderToCanvas(processedCanvas, result, width, height);

  const bench = await runBenchmark(name, currentImage, wasm);
  addBenchmarkRow(name, bench.wasmMs, bench.jsMs);

  statusEl.textContent = `Done — Wasm ${bench.wasmMs}ms vs JS ${bench.jsMs}ms`;
}

function addBenchmarkRow(filter: string, wasmMs: number, jsMs: number) {
  const speedup = jsMs > 0 ? (jsMs / wasmMs).toFixed(2) : "—";
  const tr = document.createElement("tr");
  tr.innerHTML = `<td>${filter}</td><td>${wasmMs}</td><td>${jsMs}</td><td>${speedup}×</td>`;
  benchmarkBody.prepend(tr);
}

async function applyResize() {
  if (!currentImage) return;
  const dstW = Math.round(currentImage.width / 2);
  const dstH = Math.round(currentImage.height / 2);
  const res = wasm.resize(currentImage.data, currentImage.width, currentImage.height, dstW, dstH);
  renderToCanvas(processedCanvas, res.data, res.width, res.height);
  statusEl.textContent = `Resized to ${dstW}×${dstH}`;
}

document.getElementById("btn-grayscale")!.addEventListener("click", () => applyFilter("grayscale"));
document.getElementById("btn-blur")!.addEventListener("click", () => applyFilter("blur"));
document.getElementById("btn-edge")!.addEventListener("click", () => applyFilter("edge"));
document.getElementById("btn-blur-chain")!.addEventListener("click", () => applyFilter("blur-chain"));
document.getElementById("btn-gaussian")!.addEventListener("click", () => applyFilter("gaussian"));
document.getElementById("btn-resize")!.addEventListener("click", applyResize);

init();
