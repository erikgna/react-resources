## Last week questions
For lazy routes, they handle it using the Suspense component, when we browse to the route, it will load the component and render it.
We can also show fallback UI while the component is loading.

When a component inside a <Suspense> boundary is not ready to render, it "suspends" its rendering by throwing a promise. 