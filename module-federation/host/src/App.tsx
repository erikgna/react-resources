import { Suspense, lazy, useEffect, useState } from "react";
import { RemoteErrorBoundary } from "./RemoteErrorBoundary";

const unavailable = { default: () => <span>Remote unavailable</span> };

// lazy() defers the network fetch of the remote module until first render.
// .catch() ensures the promise always resolves — if the remote is down,
// we return a stub module so Suspense never rejects and RemoteErrorBoundary
// renders its fallback instead of the host crashing.
const RemoteButton = lazy(() =>
  import("remote_app/Button").catch(() => unavailable),
);
const RemoteCounter = lazy(() =>
  import("remote_app/Counter").catch(() => unavailable),
);

function RemoteStoreLoader() {
  const [store, setStore] = useState<any>(null);

  useEffect(() => {
    import("remote_app/store")
      .then((mod) => setStore(() => mod.useStore))
      .catch(() => setStore(null));
  }, []);

  if (!store) {
    return <div>Loading store...</div>;
  }

  return <RemoteStoreConsumer useStoreHook={store} />;
}

function RemoteStoreConsumer({ useStoreHook }: { useStoreHook: any }) {
  const count = useStoreHook((s: any) => s.count);
  const inc = useStoreHook((s: any) => s.inc);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={inc}>Increment</button>
    </div>
  );
}

function App() {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    // Non-component remote module — imported dynamically the same way.
    // This runs after mount so it doesn't block the initial render.
    import("remote_app/utils")
      .then(({ formatCount }) => setFormatted(formatCount(42)))
      .catch(() => setFormatted("Remote unavailable"));
  }, []);

  return (
    <div>
      <h1>Host App</h1>

      {/* RemoteErrorBoundary catches load failures so the host doesn't crash
          if the remote is unreachable. Suspense handles the loading state. */}
      <RemoteErrorBoundary>
        <Suspense fallback={<div>Loading button...</div>}>
          <RemoteButton />
        </Suspense>
      </RemoteErrorBoundary>

      <RemoteErrorBoundary>
        <Suspense fallback={<div>Loading counter...</div>}>
          <RemoteCounter />
        </Suspense>
      </RemoteErrorBoundary>
      <p>{formatted}</p>

      <h1>Zustand</h1>
      <RemoteStoreLoader />
    </div>
  );
}

export default App;
