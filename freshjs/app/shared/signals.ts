import { signal } from "@preact/signals";

// Module-level signals: same instance in both islands on the client
// because JS modules are singletons — one import path = one instance.
export const sharedMessage = signal("type something in Island A...");
export const sharedCounter = signal(0);
