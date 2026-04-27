Why you’re not seeing a difference
1. You’re still re-rendering the entire list

This is the biggest issue.

In both versions, you do:

setItems(prev => {
  const next = [...prev];
  // mutate 20% of items
  return next;
});

Even though you only change 20%, you are:

Creating a new array
Replacing many objects
Triggering a full list reconciliation

👉 For React:

It will re-run .map() for ALL items

👉 For Million (<For>):

It still has to process the whole list because the reference changed

💡 Million helps more when updates are localized, not when the entire dataset changes every frame.

2. 3 seconds is too short (and not measured correctly)

You're measuring:

const t0 = performance.now();
setItems(...)
setLastMs(performance.now() - t0);

This does NOT measure render time, only the state update call.

React rendering is async — your measurement misses the expensive part.

3. Browser bottleneck > React bottleneck

At 10k–50k DOM nodes, your bottleneck becomes:

Layout
Paint
DOM updates

Not React vs Million.

👉 So both feel equally slow (or equally fast).

4. Million shines in fine-grained updates, not brute-force updates

Your stress test is basically:

"randomly mutate thousands of items every frame"

That’s worst-case for both libraries.

Million is better when:

Few items change
Updates are predictable
Components are stable
How to fix your POC (this is key)

If you want to actually see the difference, change your test strategy:

✅ Test 1 — Single Item Update (IMPORTANT)
setItems(prev => {
  const next = [...prev];
  const idx = Math.floor(Math.random() * next.length);
  next[idx] = { ...next[idx], highlighted: !next[idx].highlighted };
  return next;
});

👉 Only 1 item changes per frame

Expected result:
React → still re-renders whole list
Million → updates only 1 node
✅ Test 2 — Stable references (CRITICAL)

Right now you recreate objects.

Instead, try mutating less aggressively:

setItems(prev => {
  const next = [...prev];
  const idx = Math.floor(Math.random() * next.length);
  next[idx].highlighted = !next[idx].highlighted;
  return next;
});

👉 This helps Million detect minimal changes

✅ Test 3 — Use block() (you didn’t use it)

You're only using <For>, which is not the main optimization.

Wrap your item:

import { block } from 'million/react';

const ListItem = block(({ item }: { item: Item }) => {
  return (
    <li style={{ background: item.highlighted ? '#dfd' : 'transparent' }}>
      {item.value}
    </li>
  );
});

👉 This is where Million gets serious

✅ Test 4 — Measure actual render time

Use:

useEffect(() => {
  const t = performance.now();
  return () => {
    console.log('Render took', performance.now() - t);
  };
});

Or better:

React Profiler
Chrome Performance tab
✅ Test 5 — Reduce DOM pressure

Try:

1k items instead of 50k
Focus on update speed, not initial render
What you should observe

If done right:

Scenario	React	Million
1 item update	❌ Re-renders many	✅ Updates 1
20% updates	⚠️ Slow	⚠️ Still heavy
50k DOM	❌ Browser bound	❌ Browser bound
Fine-grained UI	❌	✅ Strong
Honest conclusion (important)

Million.js is not magic.

It will NOT:

Fix bad state patterns
Beat browser limits
Optimize brute-force updates

It WILL:

Reduce unnecessary re-renders
Shine in high-frequency small updates
Help in dashboards / real-time UIs