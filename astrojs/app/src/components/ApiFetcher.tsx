import { useState, useEffect } from "react";

interface Post {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  url: string;
}

export default function ApiFetcher() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [elapsed, setElapsed] = useState<number | null>(null);

  function load() {
    setStatus("loading");
    const t = performance.now();
    fetch("/api/posts.json")
      .then((r) => r.json())
      .then((data: Post[]) => {
        setPosts(data);
        setElapsed(Math.round(performance.now() - t));
        setStatus("done");
      })
      .catch(() => setStatus("error"));
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={s.box}>
      <div style={s.header}>
        <span style={s.label}>React island — fetches /api/posts.json</span>
        <button style={s.reload} onClick={load} disabled={status === "loading"}>
          {status === "loading" ? "Loading…" : "Reload"}
        </button>
      </div>

      {status === "loading" && <div style={s.loading}>Fetching…</div>}

      {status === "done" && (
        <>
          <div style={s.meta}>
            {posts.length} posts · {elapsed}ms · <a href="/api/posts.json" target="_blank" style={s.link}>/api/posts.json ↗</a>
          </div>
          <ul style={s.list}>
            {posts.map((p) => (
              <li key={p.slug} style={s.item}>
                <a href={p.url} style={s.postLink}>{p.title}</a>
                <div style={s.tags}>
                  {p.tags.map((t) => (
                    <span key={t} style={s.tag}>{t}</span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {status === "error" && <div style={s.error}>Fetch failed — run `npm run build` first if in preview mode</div>}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  box: { border: "1px solid #e0e0e0", borderRadius: 10, overflow: "hidden", fontFamily: "system-ui, sans-serif", fontSize: 14 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f0f0f0", borderBottom: "1px solid #e0e0e0" },
  label: { fontSize: 12, color: "#555", fontFamily: "monospace" },
  reload: { fontSize: 12, padding: "4px 10px", borderRadius: 6, border: "1px solid #ccc", background: "white", cursor: "pointer" },
  loading: { padding: 16, color: "#888", fontStyle: "italic", fontSize: 13 },
  meta: { padding: "8px 14px", fontSize: 12, color: "#888", borderBottom: "1px solid #f0f0f0" },
  link: { color: "#4ab", fontFamily: "monospace" },
  list: { margin: 0, padding: 0, listStyle: "none" },
  item: { padding: "10px 14px", borderBottom: "1px solid #f5f5f5" },
  postLink: { color: "#333", fontWeight: 600, textDecoration: "none", display: "block", marginBottom: 4 },
  tags: { display: "flex", gap: 5, flexWrap: "wrap" },
  tag: { background: "#e8f0fe", color: "#3367d6", fontSize: 11, padding: "1px 6px", borderRadius: 8 },
  error: { padding: 16, color: "#a44", fontSize: 13 },
};
