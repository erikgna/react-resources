import { createSignal, createResource, Suspense, Show, For, type JSX } from 'solid-js';

interface Result {
  id: number;
  text: string;
  score: number;
}

// Simulates an async API call — no useEffect + useState needed in SolidJS
async function fetchResults(query: string): Promise<Result[]> {
  if (!query.trim()) return [];
  await new Promise<void>(r => setTimeout(r, 300 + Math.random() * 700));
  if (query.toLowerCase() === 'error') throw new Error('Simulated server error (500)');
  return Array.from({ length: 6 }, (_, i) => ({
    id: i,
    text: `${query} — result #${i + 1}`,
    score: Math.round(Math.random() * 100),
  }));
}

export default function ResourceDemo() {
  const [query, setQuery] = createSignal('');
  const [draft, setDraft] = createSignal('');

  // createResource(source, fetcher):
  // - Re-runs fetcher automatically when source signal changes.
  // - Integrates with <Suspense> — suspends while loading.
  // - Exposes .loading, .error, .state on the returned accessor.
  const [results, { refetch }] = createResource(query, fetchResults);

  const submit = () => {
    const q = draft().trim();
    if (q) setQuery(q);
  };

  return (
    <div style={{ 'max-width': '520px' }}>
      <h3 style={{ margin: '0 0 12px', color: '#0ea5e9' }}>Resource — createResource + Suspense</h3>
      <p style={{ 'font-size': '13px', color: '#666', 'margin-bottom': '16px' }}>
        <code>createResource(query, fetcher)</code> re-fetches when <code>query()</code> changes.
        No <code>useEffect</code>. No <code>useState</code> for loading/error.
        Type <strong>"error"</strong> to trigger error state.
      </p>

      <div style={{ display: 'flex', gap: '8px', 'margin-bottom': '12px' }}>
        <input
          type="text"
          value={draft()}
          onInput={e => setDraft(e.currentTarget.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder='search (or "error")'
          style={{
            flex: '1',
            padding: '8px 12px',
            'border-radius': '6px',
            border: '1px solid #ddd',
            'font-size': '14px',
          }}
        />
        <button onClick={submit} style={actionBtn('#0ea5e9')}>Search</button>
        <button onClick={() => refetch()} style={actionBtn('#6366f1')}>Refetch</button>
      </div>

      <div style={{ 'font-size': '12px', color: '#888', 'margin-bottom': '12px' }}>
        state: <strong>{results.state}</strong>
        {' | '}loading: <strong>{String(results.loading)}</strong>
        {query() && <> {' | '}query: <strong>"{query()}"</strong></>}
      </div>

      <Suspense
        fallback={
          <div style={{
            padding: '20px',
            'text-align': 'center',
            color: '#888',
            background: '#f5f5f5',
            'border-radius': '6px',
            'font-size': '13px',
          }}>
            Fetching…
          </div>
        }
      >
        <Show when={results.error}>
          <div style={{
            padding: '12px',
            background: '#fee2e2',
            'border-radius': '6px',
            color: '#dc2626',
            'font-size': '14px',
          }}>
            Error: {(results.error as Error).message}
          </div>
        </Show>

        <Show when={!results.error}>
          <Show
            when={(results() ?? []).length > 0}
            fallback={
              <div style={{ padding: '12px', color: '#888', 'font-size': '13px' }}>
                {query() ? 'No results.' : 'Enter a search term above.'}
              </div>
            }
          >
            <ul style={{ margin: 0, padding: 0 }}>
              <For each={results()}>
                {(item, i) => (
                  <li style={{
                    padding: '8px 12px',
                    'list-style': 'none',
                    border: '1px solid #e5e7eb',
                    'border-radius': '4px',
                    'margin-bottom': '4px',
                    'font-size': '13px',
                    display: 'flex',
                    'justify-content': 'space-between',
                    'align-items': 'center',
                  }}>
                    <span>
                      <span style={{ color: '#0ea5e9', 'font-weight': '600', 'margin-right': '8px' }}>
                        #{i() + 1}
                      </span>
                      {item.text}
                    </span>
                    <span style={{
                      'font-size': '11px',
                      color: '#fff',
                      background: item.score > 70 ? '#059669' : item.score > 40 ? '#d97706' : '#dc2626',
                      padding: '2px 6px',
                      'border-radius': '4px',
                    }}>
                      {item.score}
                    </span>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </Show>
      </Suspense>

      <div style={{ 'margin-top': '16px', 'font-size': '12px', color: '#888', 'line-height': '1.7', background: '#f9f9f9', padding: '12px', 'border-radius': '6px' }}>
        <strong>React equivalent would need:</strong> <code>useState(data)</code> + <code>useState(loading)</code> +
        <code>useState(error)</code> + <code>useEffect([query])</code> + manual abort controller for cleanup.<br />
        <strong>SolidJS:</strong> one <code>createResource</code> call. Source signal drives refetch automatically.
        <code>Suspense</code> handles the loading boundary.
      </div>
    </div>
  );
}

function actionBtn(color: string): JSX.CSSProperties {
  return {
    padding: '8px 16px',
    background: color,
    color: '#fff',
    border: 'none',
    'border-radius': '6px',
    cursor: 'pointer',
    'font-size': '13px',
    'font-weight': '600',
  };
}
