It separates into static and dynamic parts
Milion will know what is going to change, React figures it out
Milion directly updates only the exact DOM nodes that changed

React builds the virtual tree, compares old with new and applies the patches.

Pros
Updates are extreme fast
Good for large lists, frequent updates and dashboards
Only updates what is changed

Cons
Need to think about static vs dynamic parts
Small community
Some edge cases dont work very well
For full experience, depends on build compiltation

## Block
block: The Component Wrapper
The block() function is the fundamental unit of Million.js. It takes a standard React component and turns it into a Block.

What it does: It creates a "Hyper-Optimized" version of a component. Instead of React diffing the entire VDOM tree for that component, Million.js identifies exactly which part of the DOM needs to change and updates it directly.

Best for: Static or complex UI "islands" that update frequently but have a stable structure (like a chart widget, a profile card, or a single row in a table).

Constraint: It works best with primitive props (strings, numbers, booleans) because it uses a simple "dirty check" to decide when to re-render.

## For
The <For /> component is a dedicated replacement for {items.map()}. It is specifically engineered to handle large arrays.

What it does: It takes an array and a function. Crucially, it automatically "blocks" the items inside the loop for you. You don't need to wrap the children in block() manually (as you saw in your error, doing so actually breaks it).

Why use it: Standard .map() in React is slow for lists because React has to reconcile every single item's VDOM when just one item changes. <For /> moves the list diffing logic out of React and into Million’s optimized "Block" engine.

Best for: Large lists (100+ items), data tables, or feeds where performance usually starts to lag.