<script>
  import { getContext } from 'svelte';

  const theme = getContext('theme');
  let evals = $state(0);

  $effect(() => {
    theme.count;
    evals++;
  });
</script>

<div style="border:2px solid #059669;border-radius:8px;padding:14px;flex:1">
  <div style="font-size:11px;color:#888;margin-bottom:2px;font-weight:600;letter-spacing:0.05em">COUNT</div>
  <div style="font-size:10px;color:#bbb;margin-bottom:10px">updates every 1s</div>
  <div style="font-size:36px;font-weight:700;color:#059669;margin-bottom:8px">{theme.count}</div>
  <div style="font-size:12px;color:#888;margin-top:8px">
    Reactive evals: <strong style="color:#059669">{evals}</strong>
  </div>
</div>
