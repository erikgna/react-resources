
import init, {
  alloc,
  dealloc,
  double_values,
} from "./wasm-pkg/wasm_image.js";

let memory: WebAssembly.Memory;

export class WasmNumberProcessor {
  async init(): Promise<void> {
    const exports = await init();
    memory = exports.memory;
  }

  doubleArray(data: Int32Array): Int32Array {
    const ptr = this.copyIn(data);
    double_values(ptr, data.length);
    const result = this.copyOut(ptr, data.byteLength);
    dealloc(ptr, data.byteLength);
    return result;
  }

  private copyIn(data: Int32Array): number {
    const ptr = alloc(data.byteLength);
    new Uint8Array(memory.buffer).set(new Uint8Array(data.buffer), ptr);
    return ptr;
  }

  private copyOut(ptr: number, byteLen: number): Int32Array {
    const bytes = new Uint8Array(memory.buffer).slice(ptr, ptr + byteLen);
    return new Int32Array(bytes.buffer);
  }
}
