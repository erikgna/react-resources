<script>
  import { untrack } from 'svelte';

  function fib(n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
  }

  let n = $state(10);
  let tick = $state(0);
  let recomputeCount = $state(0);

  // $derived tracks only the reactive reads inside it.
  // tick is NOT read here — derived is blind to it.
  const fibResult = $derived(fib(n));

  // Effect subscribes to fibResult — fires only when derived output changes.
  $effect(() => {
    fibResult;
    recomputeCount++;
  });

  // fibWithUntrackedTick reads tick without subscribing.
  // untrack() breaks the reactive tracking for the wrapped call.
  const fibWithUntrackedTick = $derived.by(() => {
    const result = fib(n);
    untrack(() => tick); // read tick but do NOT create dependency
    return result;
  });

  $effect(() => {
    const id = setInterval(() => tick++, 1_000);
    return () => clearInterval(id);
  });
</script>

<div style="max-width:520px">
  <h3 style="margin:0 0 12px;color:#d97706">Derived — Cached Computed State</h3>
  <p style="font-size:13px;color:#666;margin-bottom:16px">
    <code>$derived</code> only recomputes when <em>its own</em> tracked reactive reads change.
    Clock ticks every second — derived stays cached. Side effects (counting runs) belong in
    <code>$effect</code>, not inside the derived expression.
  </p>

  <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
    <label style="font-size:14px;font-weight:600;white-space:nowrap">N = {n}</label>
    <input
      type="range"
      min="1"
      max="40"
      bind:value={n}
      style="flex:1"
    />
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">
    <div style="border:2px solid #d97706;border-radius:8px;padding:12px;text-align:center">
      <div style="font-size:11px;color:#888;margin-bottom:4px">fib(N)</div>
      <div style="font-size:22px;font-weight:700;color:#d97706">{fibResult}</div>
    </div>
    <div style="border:2px solid #6366f1;border-radius:8px;padding:12px;text-align:center">
      <div style="font-size:11px;color:#888;margin-bottom:4px">Derived recomputed</div>
      <div style="font-size:22px;font-weight:700;color:#6366f1">{recomputeCount}</div>
    </div>
    <div style="border:2px solid #059669;border-radius:8px;padding:12px;text-align:center">
      <div style="font-size:11px;color:#888;margin-bottom:4px">Clock ticks</div>
      <div style="font-size:22px;font-weight:700;color:#059669">{tick}</div>
    </div>
  </div>

  <div style="font-size:12px;color:#888;line-height:1.7;background:#f9f9f9;padding:12px;border-radius:6px">
    <strong>Experiment 1 — Drag slider:</strong> "Derived recomputed" increments. fib recalculates.<br>
    <strong>Experiment 2 — Wait:</strong> Clock ticks but "Derived recomputed" stays frozen.<br>
    <strong>Experiment 3 — untrack:</strong> <code>fibWithUntrackedTick</code> reads tick() without subscribing.
    Derived does not rerun on ticks even though tick is read inside.
    Current value: <strong>{fibWithUntrackedTick}</strong> (always equals fib(N) — tick has no effect).<br><br>
    <strong>vs SolidJS:</strong> <code>createMemo(() => fib(n()))</code> — same concept.
    Svelte: <code>$derived(fib(n))</code> — compiler intercepts the read of <code>n</code>.
  </div>
</div>
