import { sharedMessage, sharedCounter } from "../shared/signals.ts";

// Island A owns writes to the shared signals.
export default function SharedSignalA() {
  return (
    <div style="border:2px solid #0ea5e9;border-radius:10px;padding:16px">
      <div style="font-size:11px;font-weight:700;color:#0ea5e9;margin-bottom:12px;letter-spacing:0.05em">
        ISLAND A — writes shared signals
      </div>

      <label style="font-size:12px;color:#555;display:block;margin-bottom:4px">
        sharedMessage
      </label>
      <input
        type="text"
        value={sharedMessage.value}
        onInput={(e) => { sharedMessage.value = (e.target as HTMLInputElement).value; }}
        style="width:100%;padding:8px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;box-sizing:border-box;margin-bottom:12px"
      />

      <label style="font-size:12px;color:#555;display:block;margin-bottom:4px">
        sharedCounter: {sharedCounter}
      </label>
      <div style="display:flex;gap:8px">
        <button
          onClick={() => sharedCounter.value--}
          style="flex:1;padding:8px;border:2px solid #0ea5e9;border-radius:6px;background:transparent;color:#0ea5e9;font-weight:700;cursor:pointer"
        >
          −
        </button>
        <button
          onClick={() => sharedCounter.value++}
          style="flex:1;padding:8px;border:none;background:#0ea5e9;color:#fff;border-radius:6px;font-weight:700;cursor:pointer"
        >
          +
        </button>
      </div>
    </div>
  );
}
