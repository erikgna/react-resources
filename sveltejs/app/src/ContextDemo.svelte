<script>
  import { setContext } from 'svelte';
  import ColorPanel from './context/ColorPanel.svelte';
  import CountPanel from './context/CountPanel.svelte';
  import UsernamePanel from './context/UsernamePanel.svelte';

  let color = $state('#6366f1');
  let count = $state(0);
  let username = $state('alice');
  let running = $state(false);

  // Pass an object with getters — NOT plain values.
  // Getters preserve reactivity: reading ctx.color inside a child tracks the $state.
  // Passing { color, count, username } (plain values) would snapshot at call time — stale.
  setContext('theme', {
    get color() { return color; },
    get count() { return count; },
    get username() { return username; },
  });

  $effect(() => {
    if (!running) return;
    let rafId;
    const tick = () => {
      color = `hsl(${Math.floor(Math.random() * 360)},65%,45%)`;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  });

  $effect(() => {
    if (!running) return;
    const id = setInterval(() => count++, 1_000);
    return () => clearInterval(id);
  });
</script>

<div style="max-width:640px">
  <h3 style="margin:0 0 12px;color:#8b5cf6">Context — Selective Reactive Subscriptions</h3>
  <p style="font-size:13px;color:#666;margin-bottom:16px">
    Context provides an object with getters — not snapshots. Each child subscribes only to what it reads.
    In React, any context change re-renders all consumers. Here, only the relevant panel's
    reactive expression updates.
  </p>

  <div style="margin-bottom:16px">
    <button
      onclick={() => running = !running}
      style="padding:10px 24px;background:{running ? '#dc2626' : '#8b5cf6'};color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:14px"
    >
      {running ? 'STOP' : 'START (color=60fps, count=1hz)'}
    </button>
  </div>

  <div style="display:flex;gap:12px">
    <ColorPanel />
    <CountPanel />
    <UsernamePanel />
  </div>

  <div style="margin-top:16px;font-size:12px;color:#888;line-height:1.7;background:#f9f9f9;padding:12px;border-radius:6px">
    <strong>What to observe:</strong><br>
    Color panel eval count rockets (60 per second).<br>
    Count panel eval count increments once per second.<br>
    Username panel eval count stays at 1 (initial subscription only).<br>
    All three panels share the same context. None of them re-run their full script — only reactive expressions patch the DOM.<br><br>
    <strong>vs SolidJS:</strong> SolidJS passes signal accessors (functions) in context.
    Svelte 5 passes an object with JS getters — same effect: reactive reads are deferred until the child accesses the property.
  </div>
</div>
