<script>
  function generate(count) {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      value: `Item ${i}`,
      highlighted: false,
      updateCount: 0,
    }));
  }

  const SIZES = [500, 1_000];

  let size = $state(1_000);
  // $state with an array of objects — Svelte 5 uses deep Proxy-based reactivity.
  // Mutating items[idx].highlighted directly triggers only that row's DOM update.
  let items = $state(generate(1_000));
  let updateCount = $state(0);
  let lastMs = $state(0);
  let running = $state(false);
  let bulkMs = $state(null);

  function applySize(n) {
    size = n;
    items = generate(n);
    updateCount = 0;
    bulkMs = null;
  }

  // Stress: single-item RAF update loop (3 seconds)
  $effect(() => {
    if (!running) return;

    const end = Date.now() + 3_000;
    let rafId;

    const tick = () => {
      if (Date.now() > end) {
        running = false;
        return;
      }

      const idx = Math.floor(Math.random() * items.length);
      const t0 = performance.now();

      // Deep reactivity: direct mutation — no produce() wrapper needed
      items[idx].highlighted = !items[idx].highlighted;
      items[idx].updateCount += 1;

      lastMs = performance.now() - t0;
      updateCount++;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  });

  // Simulate fresh server data — bulk highlight reassignment
  function syncFromServer() {
    const t0 = performance.now();
    for (let i = 0; i < items.length; i++) {
      items[i].highlighted = Math.random() < 0.15;
    }
    bulkMs = performance.now() - t0;
    updateCount++;
  }
</script>

<div>
  <h3 style="margin:0 0 12px;color:#059669">Store — Deep Reactive State</h3>
  <p style="font-size:13px;color:#666;margin-bottom:12px">
    <strong>Stress:</strong> single item toggled per RAF frame — only that row's DOM patches.<br>
    <strong>Bulk sync:</strong> simulate fresh server array — direct mutation, Svelte tracks per-property.
  </p>

  <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
    <span style="font-size:13px">Size:</span>
    {#each SIZES as s}
      <button
        onclick={() => applySize(s)}
        style="font-weight:{size === s ? 'bold' : 'normal'};padding:4px 10px;cursor:pointer"
      >
        {s.toLocaleString()}
      </button>
    {/each}
    <button
      onclick={() => running = true}
      disabled={running}
      style="background:{running ? '#aaa' : '#059669'};color:#fff;border:none;padding:4px 14px;border-radius:4px;cursor:{running ? 'default' : 'pointer'}"
    >
      {running ? 'Running…' : 'Stress 3s'}
    </button>
    <button
      onclick={syncFromServer}
      style="background:#6366f1;color:#fff;border:none;padding:4px 14px;border-radius:4px;cursor:pointer"
    >
      Bulk server sync
    </button>
    <span style="font-size:12px;color:#666">
      Updates: {updateCount} | patch: {lastMs.toFixed(3)}ms
      {#if bulkMs !== null} | bulk: {bulkMs.toFixed(3)}ms{/if}
    </span>
  </div>

  <div style="overflow:auto;max-height:500px;border:1px solid #eee;border-radius:4px">
    <ul style="margin:0;padding:0">
      {#each items as item (item.id)}
        <li style="background:{item.highlighted ? '#d1fae5' : 'transparent'};padding:2px 8px;list-style:none;font-size:13px;display:flex;justify-content:space-between">
          <span>{item.value}</span>
          <span style="color:{item.updateCount > 0 ? '#059669' : '#ccc'};font-size:11px">
            updates: {item.updateCount}
          </span>
        </li>
      {/each}
    </ul>
  </div>

  <div style="margin-top:12px;font-size:12px;color:#888;line-height:1.7;background:#f9f9f9;padding:12px;border-radius:6px">
    <strong>vs SolidJS:</strong> SolidJS uses <code>createStore</code> + <code>produce()</code> for mutations.
    Svelte 5 <code>$state</code> arrays use deep Proxy — direct mutation like
    <code>items[i].highlighted = true</code> is automatically tracked and surgically patches only the changed row.
    No wrapper needed.
  </div>
</div>
