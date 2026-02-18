## One-Way Data Flow

### PROS

- More predictable because data flows in one direction
- Easier to debug because every state change is explicit
- Scales better because ownership of state is clear

### CONS

- More boilerplate because you manually wire updates
- Slower to prototype because everything must be explicit
- Feels verbose for very small/simple forms

## Two-Way Binding

### PROS

- Faster to write because less boilerplate (automatic syncing)
- Simpler for small forms because model updates instantly
- Feels intuitive because UI and state stay linked automatically

### CONS

- Harder to debug because state can change from multiple hidden sources
- Less predictable because mutations aren’t always explicit
- Harder to scale because implicit reactivity becomes complex (multiple hidden sources)

## Virtual DOM and Reconciliation

The Virtual DOM (VDOM) is a lightweight, in-memory representation of the actual DOM elements.

- It allows React to perform DOM updates more efficiently by updating only the necessary elements, avoiding full re-renders of the entire UI.
- The Virtual DOM is a concept borrowed from the idea of "virtualization" in computing, where operations are performed on a virtual version of an object (like the DOM) before applying those changes to the actual object. This results in a more optimized and less resource-intensive approach.

### Reconciliation Process

1. Render Phase
  - React calls the render() method of a component to generate a new virtual DOM representation.
  - This new Virtual DOM is compared with the previous Virtual DOM snapshot.
2. Diffing Algorithm
  - React compares the old and new virtual DOM trees to determine the differences.
  - Instead of re-rendering the entire UI, React updates only the changed nodes.
3. Commit Phase
  - Once the differences are determined, React applies the updates to the real DOM in the most efficient way.
  - React batches updates and minimizes reflows and repaints for better performance.

### State and Props

When the state or props of a component change, React creates a new Virtual DOM tree. React then compares the new Virtual DOM with the previous one, determining what parts of the actual DOM need to be updated.

### Diffing Algorithm

React uses a heuristic algorithm called the Diffing algorithm for reconciliation based on these assumptions:

- **Element in different types**: Whenever the type of the element changes in the root, react will scrap the old tree and build a new one i.e a full rebuild of the tree.
- **Elements of the same type**: When the type of changed element is the same, React then checks for attributes of both versions and then only updates the node which has changes without any changes in the tree. The component will be updated in the next lifecycle call.

## React Fiber

### Problems:
- Rendering was synchronous
- Once React started rendering, it could not pause
- Large updates could block the main thread
- The UI could feel laggy

### Solution:
- Render asynchronously
- Pause rendering to handle urgent tasks
- Prioritize updates based on importance
- Improve user experience

### Analogy:

- **Old React**: Like reading a whole book without stopping.
- **Fiber**: Like reading a page, checking if something urgent happened, then continuing.

## useState
- During the initial render, React records the initial state. In subsequent re-renders (which occur when the component's state or props change), the useState hook retrieves the latest value from React's internal memory, not the initial argument again.
- React uses an internal data structure and the order in which hooks are called to associate the correct state with the correct component instance.

## React Hooks
Introduced in React 16.8, hooks solved the problem of not being able to use state or side effects in functional components, which previously required class components. They are built-in functions provided by React to "hook into" its