import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { type Item } from "../routes/api/items.ts";

type Status = "idle" | "loading" | "error";

export default function ServerDemo() {
  const items = useSignal<Item[]>([]);
  const status = useSignal<Status>("loading");
  const error = useSignal<string | null>(null);
  const draft = useSignal("");
  const posting = useSignal(false);

  const load = async () => {
    status.value = "loading";
    error.value = null;
    try {
      const res = await fetch("/api/items");
      items.value = await res.json() as Item[];
      status.value = "idle";
    } catch (e) {
      error.value = String(e);
      status.value = "error";
    }
  };

  useEffect(() => { load(); }, []);

  const addItem = async () => {
    const text = draft.value.trim();
    if (!text) return;
    posting.value = true;
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      items.value = await res.json() as Item[];
      draft.value = "";
    } catch (e) {
      error.value = String(e);
    } finally {
      posting.value = false;
    }
  };

  return (
    <div style="border:2px solid #059669;border-radius:10px;padding:16px;max-width:520px">
      <div style="font-size:11px;font-weight:700;color:#059669;margin-bottom:12px;letter-spacing:0.05em">
        ISLAND — client fetch to /api/items
      </div>

      <div style="display:flex;gap:8px;margin-bottom:12px">
        <input
          type="text"
          value={draft.value}
          onInput={(e) => { draft.value = (e.target as HTMLInputElement).value; }}
          onKeyDown={(e) => { if (e.key === "Enter") addItem(); }}
          placeholder="new item text..."
          style="flex:1;padding:8px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px"
        />
        <button
          onClick={addItem}
          disabled={posting.value}
          style="padding:8px 16px;background:#059669;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;opacity:1"
        >
          {posting.value ? "Adding…" : "POST"}
        </button>
        <button
          onClick={load}
          style="padding:8px 12px;background:transparent;border:2px solid #059669;color:#059669;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px"
        >
          GET
        </button>
      </div>

      <div style="font-size:12px;color:#888;margin-bottom:10px">
        status: <strong>{status}</strong>
        {" | "}items: <strong>{items.value.length}</strong>
      </div>

      {error.value && (
        <div style="padding:8px;background:#fee2e2;color:#dc2626;border-radius:6px;font-size:13px;margin-bottom:10px">
          Error: {error.value}
        </div>
      )}

      {status.value === "loading"
        ? (
          <div style="padding:16px;text-align:center;color:#888;font-size:13px">
            Fetching…
          </div>
        )
        : (
          <ul style="margin:0;padding:0;list-style:none">
            {items.value.map((item) => (
              <li
                key={item.id}
                style="padding:7px 10px;border:1px solid #e5e7eb;border-radius:4px;margin-bottom:4px;font-size:13px;display:flex;justify-content:space-between;align-items:center"
              >
                <span>{item.text}</span>
                <span style="font-size:11px;color:#888;font-family:monospace">
                  {new Date(item.addedAt).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        )}

      <div style="margin-top:12px;font-size:11px;color:#888;line-height:1.6;background:#f9f9f9;padding:10px;border-radius:6px">
        <strong>React equivalent:</strong> useState × 3 (items, loading, error) + useEffect.
        <br />
        <strong>Here:</strong> <code>useSignal</code> per concern, fetch on mount via <code>useEffect</code>.
        Same pattern but signals skip Preact's VDOM diff for subscribed nodes.
        <br />
        <strong>SSR comparison:</strong> the tab above showed the same items fetched server-side
        in the route <code>handler</code> — no client JS needed for that initial render.
      </div>
    </div>
  );
}
