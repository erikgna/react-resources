import { useStore } from "./store";

export function Button() {
  const { count, inc } = useStore();

  return <button onClick={inc}>Click me {count} times</button>;
}

export default Button;
