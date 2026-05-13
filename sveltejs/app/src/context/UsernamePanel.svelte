<script>
  import { getContext } from 'svelte';

  const theme = getContext('theme');
  let evals = $state(0);

  $effect(() => {
    theme.username;
    evals++;
  });
</script>

<div style="border:2px solid #d97706;border-radius:8px;padding:14px;flex:1">
  <div style="font-size:11px;color:#888;margin-bottom:2px;font-weight:600;letter-spacing:0.05em">USERNAME</div>
  <div style="font-size:10px;color:#bbb;margin-bottom:10px">never changes</div>
  <div style="font-size:20px;font-weight:600;color:#d97706;margin-bottom:8px">{theme.username}</div>
  <div style="font-size:12px;color:#888;margin-top:8px">
    Reactive evals: <strong style="color:#d97706">{evals}</strong>
  </div>
</div>
