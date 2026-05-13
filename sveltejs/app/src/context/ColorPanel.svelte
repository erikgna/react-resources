<script>
  import { getContext } from 'svelte';

  const theme = getContext('theme');
  let evals = $state(0);

  $effect(() => {
    theme.color;
    evals++;
  });
</script>

<div style="border:2px solid #6366f1;border-radius:8px;padding:14px;flex:1">
  <div style="font-size:11px;color:#888;margin-bottom:2px;font-weight:600;letter-spacing:0.05em">COLOR</div>
  <div style="font-size:10px;color:#bbb;margin-bottom:10px">updates at 60fps when running</div>
  <div style="height:48px;background:{theme.color};border-radius:4px;margin-bottom:8px;transition:background 0.05s"></div>
  <code style="font-size:12px">{theme.color}</code>
  <div style="font-size:12px;color:#888;margin-top:8px">
    Reactive evals: <strong style="color:#6366f1">{evals}</strong>
  </div>
</div>
