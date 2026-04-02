import { useRef } from "react";

export function useRenderCount(_name: string): number {
  // Ref persists across renders without causing re-renders
  const ref = useRef(0);

  // This runs on every render → increment count
  // Since refs are mutable, this does NOT trigger a re-render
  ref.current++;

  // Return how many times this component has rendered
  return ref.current;
}