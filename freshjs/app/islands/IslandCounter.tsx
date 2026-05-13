import { useSignal } from "@preact/signals";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { useEffect } from "preact/hooks";

interface Props {
  serverTime: string;
}

// Component body run counter — hydration runs this once on client.
let islandRunCount = 0;

export default function IslandCounter({ serverTime }: Props) {
  islandRunCount++;

  const count = useSignal(0);
  const clientTime = useSignal<string | null>(null);

  // useEffect only runs on client — proves hydration boundary
  useEffect(() => {
    clientTime.value = new Date().toISOString();
  }, []);

  return (
    <div style="max-width:480px">
      <div style="background:#f0f0ff;border:2px solid #6366f1;border-radius:10px;padding:16px;margin-bottom:16px">
        <div style="font-size:11px;font-weight:700;color:#6366f1;margin-bottom:10px;letter-spacing:0.05em">
          ISLAND BOUNDARY — client JS active below this line
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;font-size:12px">
          <div style="background:#fff;padding:8px;border-radius:6px">
            <div style="color:#888;margin-bottom:2px">Server rendered at</div>
            <div style="font-family:monospace;font-size:11px;color:#059669">{serverTime}</div>
          </div>
          <div style="background:#fff;padding:8px;border-radius:6px">
            <div style="color:#888;margin-bottom:2px">Client hydrated at</div>
            <div style="font-family:monospace;font-size:11px;color:#6366f1">
              {clientTime.value ?? "(not yet — SSR)"}
            </div>
          </div>
        </div>

        <div style="font-size:12px;margin-bottom:14px;color:#555">
          <code>IS_BROWSER</code>:{" "}
          <strong style={`color:${IS_BROWSER ? "#059669" : "#dc2626"}`}>
            {String(IS_BROWSER)}
          </strong>
          {" | "}
          Island body ran: <strong>{islandRunCount}</strong> time(s) (client only)
        </div>

        <div style="display:flex;align-items:center;gap:16px">
          <button
            onClick={() => count.value--}
            style="width:40px;height:40px;border-radius:8px;border:2px solid #6366f1;background:transparent;color:#6366f1;font-size:20px;cursor:pointer;font-weight:700"
          >
            −
          </button>
          <div style="font-size:48px;font-weight:700;color:#6366f1;min-width:80px;text-align:center">
            {count}
          </div>
          <button
            onClick={() => count.value++}
            style="width:40px;height:40px;border-radius:8px;border:none;background:#6366f1;color:#fff;font-size:20px;cursor:pointer;font-weight:700"
          >
            +
          </button>
        </div>
      </div>

      <div style="font-size:12px;color:#888;line-height:1.7;background:#f9f9f9;padding:12px;border-radius:6px">
        <strong>How islands work:</strong> Fresh ships zero JS for non-island components.
        The tab nav, stat cards, and page text above are pure HTML — no hydration.
        Only this <code>IslandCounter</code> component received a JS bundle.
        Open DevTools → Network → JS: you'll see one small island chunk, nothing for the rest of the page.
      </div>
    </div>
  );
}
