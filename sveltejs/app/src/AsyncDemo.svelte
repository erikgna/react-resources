<script>
  async function fetchResults(query) {
    if (!query.trim()) return [];
    await new Promise(r => setTimeout(r, 300 + Math.random() * 700));
    if (query.toLowerCase() === 'error') throw new Error('Simulated server error (500)');
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      text: `${query} — result #${i + 1}`,
      score: Math.round(Math.random() * 100),
    }));
  }

  let draft = $state('');
  let query = $state('');
  let resultsPromise = $state(null);
  let fetchCount = $state(0);

  // $effect re-runs when query changes — replaces createResource's source signal.
  // The promise is stored in $state so {#await} can react to reassignment.
  $effect(() => {
    if (!query) {
      resultsPromise = null;
      return;
    }
    fetchCount++;
    resultsPromise = fetchResults(query);
  });

  function submit() {
    const q = draft.trim();
    if (q) query = q;
  }

  function refetch() {
    if (!query) return;
    fetchCount++;
    resultsPromise = fetchResults(query);
  }

  function scoreColor(score) {
    return score > 70 ? '#059669' : score > 40 ? '#d97706' : '#dc2626';
  }
</script>

<div style="max-width:520px">
  <h3 style="margin:0 0 12px;color:#0ea5e9">Async — {`{#await}`} Template Block</h3>
  <p style="font-size:13px;color:#666;margin-bottom:16px">
    <code>$state</code> holds the Promise. <code>{`{#await}`}</code> handles loading / resolved / rejected.
    No <code>useEffect</code>. No separate loading/error state. Type <strong>"error"</strong> to trigger error state.
  </p>

  <div style="display:flex;gap:8px;margin-bottom:12px">
    <input
      type="text"
      bind:value={draft}
      onkeydown={(e) => e.key === 'Enter' && submit()}
      placeholder='search (or "error")'
      style="flex:1;padding:8px 12px;border-radius:6px;border:1px solid #ddd;font-size:14px"
    />
    <button
      onclick={submit}
      style="padding:8px 16px;background:#0ea5e9;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600"
    >Search</button>
    <button
      onclick={refetch}
      style="padding:8px 16px;background:#6366f1;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600"
    >Refetch</button>
  </div>

  <div style="font-size:12px;color:#888;margin-bottom:12px">
    fetches: <strong>{fetchCount}</strong>
    {#if query} | query: <strong>"{query}"</strong>{/if}
  </div>

  {#if resultsPromise === null}
    <div style="padding:12px;color:#888;font-size:13px">Enter a search term above.</div>
  {:else}
    {#await resultsPromise}
      <div style="padding:20px;text-align:center;color:#888;background:#f5f5f5;border-radius:6px;font-size:13px">
        Fetching…
      </div>
    {:then results}
      {#if results.length === 0}
        <div style="padding:12px;color:#888;font-size:13px">No results.</div>
      {:else}
        <ul style="margin:0;padding:0">
          {#each results as item, i}
            <li style="padding:8px 12px;list-style:none;border:1px solid #e5e7eb;border-radius:4px;margin-bottom:4px;font-size:13px;display:flex;justify-content:space-between;align-items:center">
              <span>
                <span style="color:#0ea5e9;font-weight:600;margin-right:8px">#{i + 1}</span>
                {item.text}
              </span>
              <span style="font-size:11px;color:#fff;background:{scoreColor(item.score)};padding:2px 6px;border-radius:4px">
                {item.score}
              </span>
            </li>
          {/each}
        </ul>
      {/if}
    {:catch err}
      <div style="padding:12px;background:#fee2e2;border-radius:6px;color:#dc2626;font-size:14px">
        Error: {err.message}
      </div>
    {/await}
  {/if}

  <div style="margin-top:16px;font-size:12px;color:#888;line-height:1.7;background:#f9f9f9;padding:12px;border-radius:6px">
    <strong>React equivalent would need:</strong> <code>useState(data)</code> + <code>useState(loading)</code> +
    <code>useState(error)</code> + <code>useEffect([query])</code> + manual abort controller.<br>
    <strong>SolidJS:</strong> <code>createResource(query, fetcher)</code> + <code>Suspense</code>.<br>
    <strong>Svelte 5:</strong> <code>$state</code> Promise + <code>{`{#await}`}</code> block.
    <code>$effect</code> re-runs when <code>query</code> changes, replacing the promise.
    Template block handles all three states inline.
  </div>
</div>
