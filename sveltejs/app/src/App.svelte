<script>
  import ReactiveDemo from './ReactiveDemo.svelte';
  import DerivedDemo from './DerivedDemo.svelte';
  import StoreDemo from './StoreDemo.svelte';
  import ContextDemo from './ContextDemo.svelte';
  import AsyncDemo from './AsyncDemo.svelte';

  let mode = $state('reactive');

  const tabs = [
    { id: 'reactive', label: 'Reactive ($state)', color: '#6366f1' },
    { id: 'derived',  label: 'Derived ($derived)', color: '#d97706' },
    { id: 'store',    label: 'Store (deep $state)', color: '#059669' },
    { id: 'context',  label: 'Context', color: '#8b5cf6' },
    { id: 'async',    label: 'Async ({#await})', color: '#0ea5e9' },
  ];

  function btnStyle(tab) {
    const active = mode === tab.id;
    return [
      'padding:8px 20px',
      `border:2px solid ${tab.color}`,
      'border-radius:6px',
      `background:${active ? tab.color : 'transparent'}`,
      `color:${active ? '#fff' : tab.color}`,
      'cursor:pointer',
      'font-weight:600',
      'font-size:14px',
    ].join(';');
  }
</script>

<div style="padding:24px;font-family:system-ui,sans-serif">
  <h2 style="margin-bottom:16px;font-size:18px">SvelteJS POC</h2>
  <div style="display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap">
    {#each tabs as tab}
      <button onclick={() => mode = tab.id} style={btnStyle(tab)}>
        {tab.label}
      </button>
    {/each}
  </div>

  {#if mode === 'reactive'}
    <ReactiveDemo />
  {:else if mode === 'derived'}
    <DerivedDemo />
  {:else if mode === 'store'}
    <StoreDemo />
  {:else if mode === 'context'}
    <ContextDemo />
  {:else if mode === 'async'}
    <AsyncDemo />
  {/if}
</div>
