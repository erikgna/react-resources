<script>
  // Script block runs once per component instance — like SolidJS component body.
  // $state bindings patch DOM expressions directly; this block never re-runs on state change.
  let initCount = 0;
  initCount++;

  let value = $state(0);
  let color = $state('#6366f1');
  let isRunning = $state(false);

  $effect(() => {
    if (!isRunning) return;

    let rafId;
    const tick = () => {
      value = Math.random();
      color = `hsl(${Math.floor(Math.random() * 360)},70%,45%)`;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    // Return cleanup — Svelte 5 equivalent of SolidJS onCleanup
    return () => cancelAnimationFrame(rafId);
  });
</script>

<div style="max-width:440px">
  <p style="font-size:13px;color:#666;margin-bottom:12px">
    Script block initialized: <strong>{initCount}</strong> time(s).
    <code>$state</code> updates DOM expressions directly — script never re-runs.
  </p>

  <button
    onclick={() => isRunning = !isRunning}
    style="width:100%;padding:12px;margin-bottom:20px;border-radius:8px;border:none;background:{isRunning ? '#dc2626' : '#6366f1'};color:white;font-weight:bold;cursor:pointer;font-size:14px"
  >
    {isRunning ? 'STOP' : 'START 60FPS LOOP'}
  </button>

  <div style="background-color:{color};padding:24px;border-radius:12px;color:#fff;font-family:monospace;text-align:center;font-size:28px;border:4px solid rgba(255,255,255,0.2);transition:background-color 0.05s">
    VALUE: {value.toFixed(6)}
  </div>

  <div style="margin-top:16px;font-size:12px;color:#888;line-height:1.6">
    <strong>How it works:</strong> <code>$state</code> is a compile-time rune.
    Reading <code>value</code> in a template expression creates a reactive binding.
    When the signal updates, only that DOM text node is patched.
    <code>$effect</code> re-runs when its reactive deps change; return a function for cleanup.
    <br><br>
    <strong>vs SolidJS:</strong> <code>createSignal</code> returns <code>[getter(), setter()]</code> — you call <code>value()</code>.
    Svelte 5 runes are compiler sugar — <code>value</code> reads/writes are intercepted at compile time.
  </div>
</div>
