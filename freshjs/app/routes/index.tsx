import { type Handlers, type PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import IslandCounter from "../islands/IslandCounter.tsx";
import SignalsDemo from "../islands/SignalsDemo.tsx";
import SharedSignalA from "../islands/SharedSignalA.tsx";
import SharedSignalB from "../islands/SharedSignalB.tsx";
import ServerDemo from "../islands/ServerDemo.tsx";
import StatCard from "../components/StatCard.tsx";
import { type Item } from "./api/items.ts";

type Tab = "islands" | "signals" | "server" | "shared";

interface PageData {
  tab: Tab;
  serverTime: string;
  initialItems: Item[];
}

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const rawTab = url.searchParams.get("tab") ?? "islands";
    const tab = (["islands", "signals", "server", "shared"].includes(rawTab)
      ? rawTab
      : "islands") as Tab;

    let initialItems: Item[] = [];
    if (tab === "server") {
      const resp = await fetch(`${url.origin}/api/items`);
      initialItems = await resp.json() as Item[];
    }

    return ctx.render({
      tab,
      serverTime: new Date().toISOString(),
      initialItems,
    });
  },
};

const TABS: { key: Tab; label: string; color: string }[] = [
  { key: "islands", label: "Islands", color: "#6366f1" },
  { key: "signals", label: "Signals", color: "#d97706" },
  { key: "server", label: "Server Handler", color: "#059669" },
  { key: "shared", label: "Shared State", color: "#0ea5e9" },
];

export default function Home({ data }: PageProps<PageData>) {
  const { tab, serverTime, initialItems } = data;

  return (
    <>
      <Head>
        <title>Fresh JS POC</title>
        <link rel="stylesheet" href="/styles.css" />
      </Head>

      <div style="padding:24px;font-family:system-ui,sans-serif;max-width:680px">
        <h2 style="margin:0 0 4px;font-size:20px">Fresh JS POC</h2>
        <p style="margin:0 0 20px;font-size:12px;color:#888">
          Server rendered at: <strong>{serverTime}</strong> — this text is pure HTML, zero JS.
        </p>

        {/* SSR-only stat cards — zero JS shipped for these */}
        <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap">
          <StatCard label="Framework" value="Fresh 1.7" color="#6366f1" />
          <StatCard label="Runtime" value="Deno" color="#059669" />
          <StatCard label="Default JS" value="0 bytes" color="#dc2626" />
          <StatCard label="Reactivity" value="Preact Signals" color="#d97706" />
        </div>

        {/* Tab nav — plain <a> links, zero JS navigation */}
        <div style="display:flex;gap:8px;margin-bottom:28px;flex-wrap:wrap">
          {TABS.map(({ key, label, color }) => (
            <a
              key={key}
              href={`?tab=${key}`}
              style={`
                padding:8px 20px;
                border:2px solid ${color};
                border-radius:6px;
                background:${tab === key ? color : "transparent"};
                color:${tab === key ? "#fff" : color};
                font-weight:600;
                font-size:13px;
                text-decoration:none;
              `}
            >
              {label}
            </a>
          ))}
        </div>

        {tab === "islands" && (
          <div>
            <p style="font-size:13px;color:#666;margin-bottom:16px">
              Only components in <code>islands/</code> are hydrated on the client.
              Everything else — including this paragraph and the stat cards above — is
              pure SSR HTML. Zero JS shipped for non-island elements. The counter below
              <strong> is</strong> an island; click it to prove client-side hydration.
            </p>
            <IslandCounter serverTime={serverTime} />
          </div>
        )}

        {tab === "signals" && (
          <div>
            <p style="font-size:13px;color:#666;margin-bottom:16px">
              Preact Signals inside islands: <code>signal()</code>, <code>computed()</code>,{" "}
              <code>effect()</code>. Fine-grained DOM updates — only the subscribed text
              node patches. No full component re-render.
            </p>
            <SignalsDemo />
          </div>
        )}

        {tab === "server" && (
          <div>
            <p style="font-size:13px;color:#666;margin-bottom:16px">
              The <code>handler</code> export in a route file handles GET/POST server-side.
              Initial items below were fetched <strong>on the server</strong> before this HTML
              was sent. The island below them uses client-side fetch to the same{" "}
              <code>/api/items</code> endpoint.
            </p>
            <div style="margin-bottom:20px">
              <h4 style="margin:0 0 8px;font-size:13px;font-weight:700;color:#059669">
                SSR-fetched initial items ({initialItems.length})
              </h4>
              <ul style="margin:0;padding:0;list-style:none">
                {initialItems.map((item) => (
                  <li
                    key={item.id}
                    style="padding:6px 10px;border:1px solid #e5e7eb;border-radius:4px;margin-bottom:4px;font-size:13px;display:flex;justify-content:space-between"
                  >
                    <span>{item.text}</span>
                    <span style="color:#888;font-size:11px">{new Date(item.addedAt).toLocaleTimeString()}</span>
                  </li>
                ))}
              </ul>
            </div>
            <ServerDemo />
          </div>
        )}

        {tab === "shared" && (
          <div>
            <p style="font-size:13px;color:#666;margin-bottom:16px">
              Two islands share state via a single <code>signal</code> exported from{" "}
              <code>shared/signals.ts</code>. No Context, no props, no store provider.
              JS module identity ensures both islands reference the same signal instance
              on the client.
            </p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
              <SharedSignalA />
              <SharedSignalB />
            </div>
            <div style="margin-top:16px;font-size:12px;color:#888;line-height:1.7;background:#f9f9f9;padding:12px;border-radius:6px">
              <strong>Why it works:</strong> JavaScript modules are singletons per realm.
              Both islands import <code>sharedMessage</code> from the same path →
              same signal instance → same reactive graph. Unlike React Context, no Provider
              wrapping needed. Unlike Redux, no global store setup needed.
            </div>
          </div>
        )}
      </div>
    </>
  );
}
