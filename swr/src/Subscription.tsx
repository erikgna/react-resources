import useSWRSubscription from "swr/subscription";

export function Subscription() {
  const { data, error } = useSWRSubscription("ws://...", (key, { next }) => {
    const socket = new WebSocket(key);
    socket.addEventListener("message", (event) => next(null, event.data));
    socket.addEventListener("error", (event) => next(event.error));
    return () => socket.close();
  });

  if (error) return <div>failed to load</div>;
  if (!data) return <div>loading...</div>;

  return <div>hello {data}!</div>;
}
