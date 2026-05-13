import { sharedMessage, sharedCounter } from "../shared/signals.ts";

// Island B only reads the shared signals — no props needed, no Provider.
export default function SharedSignalB() {
  const counterColor = sharedCounter.value > 0
    ? "#059669"
    : sharedCounter.value < 0
    ? "#dc2626"
    : "#888";

  return (
    <div style="border:2px solid #8b5cf6;border-radius:10px;padding:16px">
      <div style="font-size:11px;font-weight:700;color:#8b5cf6;margin-bottom:12px;letter-spacing:0.05em">
        ISLAND B — reads shared signals
      </div>

      <div style="margin-bottom:12px">
        <div style="font-size:12px;color:#555;margin-bottom:4px">sharedMessage</div>
        <div style="font-size:15px;font-weight:600;color:#1a1a2e;min-height:24px;word-break:break-all">
          {sharedMessage}
        </div>
      </div>

      <div>
        <div style="font-size:12px;color:#555;margin-bottom:4px">sharedCounter</div>
        <div style={`font-size:48px;font-weight:700;color:${counterColor};text-align:center`}>
          {sharedCounter}
        </div>
      </div>

      <p style="font-size:11px;color:#888;margin:12px 0 0;line-height:1.5">
        This island has no props, no context, no store. It reads directly from the
        same signal instance as Island A — shared via module identity.
      </p>
    </div>
  );
}
