import init, {
  alloc,
  dealloc,
  grayscale as wasmGrayscale,
  blur as wasmBlur,
  blur_chain,
  gaussian_blur,
  edge_detect,
  resize as wasmResize,
  resize_buf_size,
} from "./wasm-pkg/wasm_image.js";

let memory: WebAssembly.Memory;

export class WasmImageProcessor {
  async init(): Promise<void> {
    const exports = await init();
    memory = exports.memory;
  }

  grayscale(data: Uint8ClampedArray): Uint8ClampedArray {
    const ptr = this.copyIn(data);
    wasmGrayscale(ptr, data.length);
    const result = this.copyOut(ptr, data.length);
    dealloc(ptr, data.length);
    return result;
  }

  blur(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
    const ptr = this.copyIn(data);
    wasmBlur(ptr, width, height);
    const result = this.copyOut(ptr, data.length);
    dealloc(ptr, data.length);
    return result;
  }

  edgeDetect(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
    const ptr = this.copyIn(data);
    edge_detect(ptr, width, height);
    const result = this.copyOut(ptr, data.length);
    dealloc(ptr, data.length);
    return result;
  }

  blurChain(data: Uint8ClampedArray, width: number, height: number, passes: number): Uint8ClampedArray {
    const ptr = this.copyIn(data);
    blur_chain(ptr, width, height, passes);
    const result = this.copyOut(ptr, data.length);
    dealloc(ptr, data.length);
    return result;
  }

  gaussianBlur(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
    const ptr = this.copyIn(data);
    gaussian_blur(ptr, width, height);
    const result = this.copyOut(ptr, data.length);
    dealloc(ptr, data.length);
    return result;
  }

  resize(
    data: Uint8ClampedArray,
    srcW: number,
    srcH: number,
    dstW: number,
    dstH: number
  ): { data: Uint8ClampedArray; width: number; height: number } {
    const srcPtr = this.copyIn(data);
    const dstPtr = wasmResize(srcPtr, srcW, srcH, dstW, dstH);
    const dstLen = resize_buf_size(dstW, dstH);
    const result = this.copyOut(dstPtr, dstLen);
    dealloc(srcPtr, data.length);
    dealloc(dstPtr, dstLen);
    return { data: result, width: dstW, height: dstH };
  }

  private copyIn(data: Uint8ClampedArray): number {
    const ptr = alloc(data.length);
    new Uint8Array(memory.buffer).set(data, ptr);
    return ptr;
  }

  private copyOut(ptr: number, len: number): Uint8ClampedArray {
    return new Uint8ClampedArray(new Uint8Array(memory.buffer).slice(ptr, ptr + len));
  }
}
